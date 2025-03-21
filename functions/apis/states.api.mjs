import bfastnode from 'bfastnode'
import {StatesPage} from "../pages/states.page.mjs";
import {StateService} from "../services/state.service.mjs";
import {StorageUtil} from "../utils/storage.util.mjs";
import {AppUtil} from "../utils/app.util.mjs";
import {ServicesService} from "../services/services.service.mjs";

const storage = new StorageUtil();
const appUtil = new AppUtil();
const stateService = new StateService(storage, appUtil);
const serviceService = new ServicesService(storage, appUtil)
const statesPage = new StatesPage(stateService, serviceService);

export const viewModuleStates = bfastnode.bfast.functions().onGetHttpRequest(
    '/project/:project/modules/:module/resources/states',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        statesPage.indexPage(project, module).then(value => {
            response.send(value);
        }).catch(_ => {
            response.status(400).send(_);
        });
    }
);

export const createModuleStates = bfastnode.bfast.functions().onPostHttpRequest(
    '/project/:project/modules/:module/resources/states',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const body = JSON.parse(JSON.stringify(request.body));

        function statePage(error = null) {
            statesPage.indexPage(project, module, error).then(value => {
                response.send(value);
            }).catch(_ => {
                response.status(400).send(_);
            });
        }

        if (body && body.name && body.name !== '') {
            const stateName = body.name.toString().toLowerCase();
            stateService.createState(project, module, stateName).then(_ => {
                statePage();
            }).catch(reason => {
                console.log(reason);
                statePage(reason && reason.message ? reason.message : reason.toString());
            });
        } else {
            statePage("Please enter valid state name");
        }
    }
);

export const viewModuleState = bfastnode.bfast.functions().onGetHttpRequest(
    '/project/:project/modules/:module/resources/states/:state',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const selectedState = request.params.state;
        if (selectedState) {
            statesPage.viewStatePage(project, module, selectedState, request.query.error).then(value => {
                response.send(value);
            }).catch(_ => {
                response.status(400).send(_);
            });
        } else {
            statesPage.viewStatePage(project, module,).then(value => {
                response.send(value);
            }).catch(_ => {
                response.status(400).send(_);
            });
        }
    }
);

export const createMethodInAState = bfastnode.bfast.functions().onGetHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/method',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        statesPage.createMethodPage(project, module, state, {
            name: request.query.name ? request.query.name : '',
            inputs: request.query.inputs ? request.query.inputs : '',
            body: request.query.codes,
            return: 'any'
        }, request.query.error).then(value => {
            response.send(value);
        }).catch(reason => {
            response.status(400).send(reason);
        });
    }
);

export const createMethodInAStateSubmit = bfastnode.bfast.functions().onPostHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/method',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        const body = JSON.parse(JSON.stringify(request.body));
        stateService.addMethod(project, module, state, {
            name: body.name,
            inputs: body.inputs,
            return: 'any',
            body: body.codes
        }).then(_ => {
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}`);
        }).catch(reason => {
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}/method?error=${encodeURIComponent(reason && reason.message ? reason.message : reason.toString())}&codes=${encodeURIComponent(body.codes)}&name=${encodeURIComponent(body.name)}&inputs=${encodeURIComponent(body.inputs)}`);
        });
    }
);

export const updateMethodInAState = bfastnode.bfast.functions().onGetHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/method/:method',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        const method = request.params.method;
        return statesPage.updateMethodPage(project, module, state, method).then(value => {
            response.send(value);
        }).catch(reason => {
            response.status(400).redirect(
                `/project/${project}/modules/${module}/resources/states/${state}?error=${encodeURIComponent(reason && reason.message ? reason.message : '')}`
            );
        });
    }
);

export const updateMethodInAStateSubmit = bfastnode.bfast.functions().onPostHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/method/:method',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        const method = request.params.method;
        const body = JSON.parse(JSON.stringify(request.body));
        stateService.updateMethod(project, module, state, method, {
            name: body.name,
            inputs: body.inputs,
            return: 'any',
            body: body.codes
        }).then(_ => {
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}`);
        }).catch(reason => {
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}/method/${method}?error=${encodeURIComponent(reason && reason.message ? reason.message : reason.toString())}&codes=${encodeURIComponent(body.codes)}&name=${encodeURIComponent(body.name)}&inputs=${encodeURIComponent(body.inputs)}`);
        });
    }
);

export const deleteMethodInAStateSubmit = bfastnode.bfast.functions().onPostHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/method/:method/delete',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        const method = request.params.method;
        //  const body = JSON.parse(JSON.stringify(request.body));
        stateService.deleteMethod(project, module, state, method).then(_ => {
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}`);
        }).catch(reason => {
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}?error=${encodeURIComponent(reason && reason.message ? reason.message : reason.toString())}`);
        });
    }
);

export const addInjectionInAStateSubmit = bfastnode.bfast.functions().onPostHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/injections/:injection',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        const injection = request.params.injection;
        stateService.getState(project, module, state).then(async value => {
            if (value && value.injections && Array.isArray(value.injections)) {
                const exist = value.injections.filter(x => x.service.toString().toLowerCase()
                    === injection.toString().split('.')[0].toLowerCase());
                if (exist.length === 0) {
                    value.injections.push({
                        name: injection.toString().split('.')[0].toString().toLowerCase() + 'Service'.trim(),
                        service: injection.toString().split('.')[0].toString().toLowerCase().trim()
                    });
                    await stateService.jsonToStateFile(value, project, module)
                }
            }
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}`);
        }).catch(reason => {
            console.log(reason);
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}?error=${encodeURIComponent(reason && reason.message ? reason.message : reason.toString())})`)
        });
    }
);

export const deleteInjectionInAStateSubmit = bfastnode.bfast.functions().onPostHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/injections/:injection/delete',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        const injection = request.params.injection;
        stateService.getState(project, module, state).then(async value => {
            if (value && value.injections && Array.isArray(value.injections)) {
                value.injections = value.injections.filter(x => x.service.toString().toLowerCase()
                    !== injection.toString().split('.')[0].toLowerCase());
                await stateService.jsonToStateFile(value, project, module)
            }
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}`)
        }).catch(reason => {
            console.log(reason);
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}?error=${encodeURIComponent(reason && reason.message ? reason.message : reason.toString())})`)
        });
    }
);

export const addFieldInAStateSubmit = bfastnode.bfast.functions().onPostHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/fields',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        const body = JSON.parse(JSON.stringify(request.body));
        const field = body.name;
        stateService.getState(project, module, state).then(async value => {
            if (value && value.states && Array.isArray(value.states)) {
                const exist = value.states.filter(x => x.state.toString().toLowerCase()
                    === field.toString().trim());
                if (exist.length === 0) {
                    value.states.push({
                        name: field.toString().trim(),
                        state: field.toString().trim(),
                        type: 'BehaviorSubject'
                    });
                    await stateService.jsonToStateFile(value, project, module)
                }
            }
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}`)
        }).catch(reason => {
            console.log(reason);
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}?error=${encodeURIComponent(reason && reason.message ? reason.message : reason.toString())})`)
        });
    }
);

export const deleteFieldInAStateSubmit = bfastnode.bfast.functions().onPostHttpRequest(
    '/project/:project/modules/:module/resources/states/:state/fields/:field/delete',
    (request, response) => {
        const project = request.params.project;
        const module = request.params.module;
        const state = request.params.state;
        const field = request.params.field;
        stateService.getState(project, module, state).then(async value => {
            if (value && value.states && Array.isArray(value.states)) {
                value.states = value.states.filter(x => x.state.toString().toLowerCase()
                    !== field.toString().trim());
                await stateService.jsonToStateFile(value, project, module)
            }
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}`)
        }).catch(reason => {
            console.log(reason);
            response.redirect(`/project/${project}/modules/${module}/resources/states/${state}?error=${encodeURIComponent(reason && reason.message ? reason.message : reason.toString())})`)
        });
    }
);
