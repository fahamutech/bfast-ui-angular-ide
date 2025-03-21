import {readdir, readFile, writeFile} from 'fs';
import {join} from 'path';
import {promisify} from 'util';
import {AppUtil} from "../utils/app.util.mjs";

export class GuardsService {

    /**
     *
     * @param storageService {StorageUtil}
     * @param appUtil {AppUtil}
     */
    constructor(storageService, appUtil) {
        this.storageService = storageService;
        this.appUtil = appUtil;
    }

    async getGuards(project, module) {
        try {
            const projectPath = await this.storageService.getConfig(`${project}:projectPath`);
            const guardsDir = join(projectPath, 'modules', module, 'guards');
            /**
             *
             * @type {string[]}
             */
            const guards = await promisify(readdir)(guardsDir);
            return guards.filter(x => x.toString().trim().endsWith('.ts'));
        } catch (e) {
            return [];
        }
    }

    /**
     *
     * @param guard - {string} guard name
     * @param project - {string} current project
     * @param module - {string} current module
     * @return {Promise<*>}
     */
    async guardFileToJson(project, module, guard) {
        if (guard.toString().includes('.guard.ts')) {
            guard = guard.toString().split('.')[0];
        }
        const projectPath = await this.storageService.getConfig(`${project}:projectPath`);
        const guardFile = await promisify(readFile)(join(projectPath, 'modules', module, 'guards', `${guard}.guard.ts`));
        const guardJsonFile = {};
        guardJsonFile.name = this.getGuardName(guardFile.toString());
        guardJsonFile.body = this.getGuardBody(guardFile.toString());
        guardJsonFile.injections = this.appUtil.getInjectionsFromFile(guardFile.toString(), [], 'Service');
        return guardJsonFile;
    }

    async getGuard(project, module, guard) {
        return this.guardFileToJson(project, module, guard);
    }

    /**
     *
     * @param guard - {{
     *     name: string,
     *     body: string,
     *     injections: {
     *         name: string,
     *         service: string
     *     }[]
     * }}
     * @param project - {string}
     * @param module - {string}
     * @return {Promise<any>}
     */
    async jsonToGuardFile(project, module, guard) {
        const projectPath = await this.storageService.getConfig(`${project}:projectPath`);
        guard.injections = guard.injections.filter(f => f.name !== 'router');
        let serviceInjectionsWithType = guard.injections
            .map(x => {
                return 'private readonly '
                    .concat(this.appUtil.firstCaseLower(this.appUtil.kebalCaseToCamelCase(x.name)))
                    .concat(': ')
                    .concat(this.appUtil.firstCaseUpper(this.appUtil.kebalCaseToCamelCase(x.service)))
                    .concat('Service')
            });
        serviceInjectionsWithType.push('private readonly router: Router');
        serviceInjectionsWithType = serviceInjectionsWithType.join(',');
        await promisify(writeFile)(join(projectPath, 'modules', module, 'guards', `${guard.name}.guard.ts`),
            `import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
${this.getServiceImports(guard.injections)}
import {bfast, BFast} from 'bfastjs';

@Injectable({
  providedIn: 'any'
})
export class ${this.appUtil.firstCaseUpper(this.appUtil.kebalCaseToCamelCase(guard.name))}Guard implements CanActivate {
    constructor(${serviceInjectionsWithType}){
    }
    
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        ${guard.body.toString().includes('return') ? guard.body : 'return true;'}
    }
}
`
        );
        return 'done write guard'
    }

    /**
     *
     * @param project - {string}
     * @param module - {string}
     * @param guard - {string}
     */
    async createGuard(project, module, guard) {
        guard = guard.toString().replace('.guard.ts', '');
        guard = guard.replace(new RegExp('[^A-Za-z0-9-]*', 'ig'), '');
        guard = guard.replace(new RegExp('([-]{2,})', 'ig'), '-');
        if (guard && guard === '') {
            throw new Error('Guard must be alphanumeric');
        }
        const guards = await this.getGuards(project, module);
        const exists = guards.filter(x => x === guard.toString().trim().concat('.guard.ts'));
        if (exists && Array.isArray(guards) && exists.length > 0) {
            throw new Error('Guard already exist');
        } else {
            return this.jsonToGuardFile(project, module, {
                name: this.appUtil.camelCaseToKebal(guard),
                body: '',
                injections: []
            });
        }
    }

    /**
     *
     * @param guard - {{
     *     name: string,
     *     body: string,
     *     injections: Array<any>
     * }}
     * @param module - {string}
     * @param project - {string}
     */
    async updateGuard(project, module, guard) {
        guard.name = guard.name.toString().replace('.guard.ts', '').toLowerCase().trim();
        const oldGuard = await this.guardFileToJson(project, module, guard.name);
        guard.injections = oldGuard.injections;
        return this.jsonToGuardFile(project, module, guard);
    }

    getGuardName(guardFile) {
        const reg = new RegExp('(export).*(class).*({)', 'i');
        const result = guardFile.toString().match(reg);
        if (result && result[0]) {
            return this.appUtil.camelCaseToKebal(
                result[0].toString()
                    .replace('export', '')
                    .replace('class', '')
                    .replace('Guard', '')
                    .replace('implements', '')
                    .replace('CanActivate', '')
                    .replace('{', '')
                    .trim()
            );
        } else {
            throw new Error('Fail to get guard name');
        }
    }

    getGuardBody(guardFile) {
        guardFile = guardFile.toString();
        const reg = new RegExp('(canActivate).*(.|\\n)+?(<.*>.*{)', 'gm');
        const result = guardFile.toString().match(reg);
        if (result && result[0]) {
            guardFile = guardFile.substring(guardFile.indexOf(result[0]), guardFile.lastIndexOf('}'));
            guardFile = guardFile.replace(result[0], '');
            return guardFile.substring(0, guardFile.lastIndexOf('}')).trim();
        } else {
            throw new Error('Fail to get guard body');
        }
    }

    getServiceImports(injections = []) {
        let im = '';
        for (const injection of injections) {
            const serviceName = this.appUtil.firstCaseUpper(this.appUtil.kebalCaseToCamelCase(injection.service))
            im += `import {${serviceName}Service} from '../services/${injection.service}.service';\n`
        }

        return im;
    }
}
