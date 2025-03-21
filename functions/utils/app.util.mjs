export class AppUtil {
    static readonlyComponentImports = [
        'bfast',
        'BFast',
        'Component',
        'EventEmitter',
        'Input',
        'Output',
        'OnInit',
        'OnDestroy',
        'ViewChild',
        'AfterViewInit'
    ];
    static readonlyModulesImport = [
        'BrowserModule',
        'ROUTES',
        'bfast',
        'CommonModule',
        'NgModule',
        'RouterModule',
        'Routes'
    ];

    /**
     *
     * @param name
     * @return {string}
     * @public
     */
    firstCaseUpper(name) {
        return name.split('').map((value, index) => {
            if (index === 0) {
                return value.toUpperCase();
            }
            return value;
        }).join('');
    }

    /**
     *
     * @param name
     * @return {string}
     * @public
     */
    firstCaseLower(name) {
        return name.split('').map((value, index) => {
            if (index === 0) {
                return value.toLowerCase();
            }
            return value;
        }).join('');
    }

    /**
     *
     * @param kebalCase {string}
     * @return {string}
     */
    kebalCaseToCamelCase(kebalCase) {
        return kebalCase
            .trim()
            .split('-')
            .map(y => this.firstCaseUpper(y))
            .join('')
    }

    /**
     *
     * @param camelCase {string}
     * @return {string}
     */
    camelCaseToKebal(camelCase) {
        let guardNameParts = camelCase.match(new RegExp('[A-Z][a-z0-9]+', 'g'));
        if (guardNameParts) {
            return guardNameParts.map(x => x.toLowerCase()).join('-');
        } else {
            return camelCase;
        }
    }

    /**
     *
     * @param file {string} file to extract injections
     * @param thirdPartLib {Array<*>}
     * @param type {"Service" || "State"}
     * @return {*[]|{auto: boolean, service: string|string|string, name: *|string}[]}
     */
    getInjectionsFromFile(file, thirdPartLib, type) {
        const reg = new RegExp('(constructor).*\:(.|\\n)+?\\)', 'ig');
        const results = file.toString().match(reg) ? file.toString().match(reg).join('\n') : [];
        if (results) {
            return results.toString()
                .replace(new RegExp('(constructor.*\\()|(private)|(public)|(readonly)|\\)', 'gim'), '')
                .split(',')
                .filter(x => x !== '')
                .map(x => {
                    let auto = true;
                    const sImp = x.split(':')[1] ? x.split(':')[1].trim() : null;
                    const matches = thirdPartLib.filter(r => r.toString().trim() === sImp);
                    if (matches && Array.isArray(matches) && matches.length > 0) {
                        auto = false;
                    }
                    return {
                        name: x.split(':')[0]
                            ? x.split(':')[0].trim()
                            : '',
                        service: auto === true
                            ? (
                                typeof sImp == "string"
                                    ? this.camelCaseToKebal(sImp.replace(type, '').trim())
                                    : ''
                            )
                            : sImp,
                        auto: auto
                    }
                }).filter(x => x.name !== '');
        }
        return [];
    }

    getMethodsFromFile(file) {
        const reg = new RegExp(`(async)([\\s\\w]|\\n)+?\\((.|\\n)+?(:(.|\\n)+?Promise.*<)`, 'gim');
        const results = file.toString().match(reg) ? file.toString().match(reg) : [];
        const indexes = results.map(x => {
            return file.toString().indexOf(x);
        }).filter(x => x > 0);
        const methods = indexes.map((value, index, array) => {
            if (index === indexes.length - 1) {
                let closingTag = file.toString().lastIndexOf("}");
                return file.toString().substring(value, closingTag);
            }
            return file.toString().substring(value, indexes[index + 1]);
        });
        if (methods) {
            return methods.map(x => {
                const inputsMatch = x.toString().trim().match(reg);
                let inputs = inputsMatch ? inputsMatch.toString() : '';
                inputs = inputs
                    .replace(new RegExp('(async)(\\s|\\w)+?\\(', 'ig'), '')
                    .replace(new RegExp('\\)(\\W|\\n)*\\:(\\W|\\n)*Promise(\\W|\\n)*<', 'ig'), '')
                    .trim();
                let methodBody = x.toString()
                    .replace(new RegExp('(async)(.|\\n)+?\\((.|\\n)+?:(.|\\n)+?(Promise.*<.*>(\\W|\\n)*\\{)', 'gi'), '')
                    .trim();
                methodBody = methodBody
                    .substring(0, methodBody.lastIndexOf('}'))
                    .trim();
                return {
                    name: x.toString().match(new RegExp('(async)(.|\\n)+?\\(')) ?
                        x.toString().match(new RegExp('(async)(.|\\n)+?\\('))[0]
                            .toString()
                            .replace(new RegExp('async', 'ig'), '')
                            .replace(new RegExp('\\(', 'ig'), '')
                            .trim() : 'noname',
                    inputs: inputs.trim(),
                    return: "any",
                    body: methodBody
                }
            });
        } else {
            return [];
        }
    }

    getConstructorBodyFromModuleFile(moduleFile) {
        const reg = new RegExp('(constructor).*(.|\\n)*}(.|\\n)*\\/\\/(\\s|\\n)*(end)', 'ig');
        let result = moduleFile.toString().match(reg) ? moduleFile.toString().match(reg)[0] : null;
        // console.log(result);
        if (result) {
            result = result.toString()
                .replace(new RegExp('(constructor)(\\W|\\n){0,}?\\((.|\\s|\\n){0,}?\\)(\\W|\\n)*\\{', 'ig'), '')
                // .replace(new RegExp('(constructor).*(.|\\n)+?\\).*', 'ig'), '')
                .replace(new RegExp('}(\\s|\\n)*\\/\\/(.|\\n)*(end)', 'ig'), '')
                .trim()
            return result;
        } else {
            return '';
        }
    }

    /**
     *
     * @param rawImports {Array<{name: string, type: string, ref: string, readonly: boolean}>}
     * @param readonlyImports {Array<string>} readonly import names
     * @return {*}
     */
    multipleImportToSingleImportOfLib(rawImports, readonlyImports) {
        const singleImports = rawImports.filter(x => x.name.split(',').length === 1);
        const multipleImports = rawImports.filter(x => x.name.split(',').length > 1);
        multipleImports.forEach(mImport => {
            singleImports.push(...mImport.name.split(',').map(y => {
                return {
                    name: y.trim(),
                    type: mImport.type,
                    readonly: false,
                    ref: mImport.ref
                }
            }))
        });
        return singleImports.map(s => {
            s.readonly = readonlyImports.includes(s.name);
            return s;
        }).sort((a, b) => {
            return (a.readonly === b.readonly) ? 0 : a.readonly ? 1 : -1;
        });
    }
}
