import {errorMessageComponent} from "./error-message.component.mjs";
import {codeEditorComponent} from "./code-editor.component.mjs";

/**
 *
 * @param project
 * @param module
 * @param model
 * @param models
 * @param error - {string} - error to show
 * @return {string} - template of service list
 */
export const modelCreateComponent = async function (project, module, model = {
    name: '',
    body: ''
}, models = [], error = null) {
    return `
        <div style="margin-top: 24px" class="container col-xl-9 col-lg-9 col-sm-12 col-md-12 col-12">
            ${errorMessageComponent(error)}
            <div>
                <div>
                    <div class="d-flex lex-row" style="margin-bottom: 8px">
                        <h3><a href="/project/${project}/modules/${module}/resources/models" >${model.name} model</a> update</h3>
                        <span style="flex: 1 1 auto"></span>
        <!--                        <button class="btn btn-sm btn-primary">Save Service</button>-->
                    </div>
                    <input class="form-control" readonly value="${model.name}" name="name" placeholder="enter service name" type="text">
                </div>
                <hr>
                <div class="d-flex align-items-center" style="margin-bottom: 8px">
                    <h3>Body</h3>
                    <span style="flex: 1 1 auto"></span>
                    <button style="display: none" id="updateStyleButton" class="btn btn-primary">Update</button>
                    <div style="display: none" id="saveProgress" class="spinner-border text-primary" role="status">
<!--                      <span class="visually-hidden">Loading...</span>-->
                    </div>
                </div>
                <div class="code-editor" id="styleCode"></div>
                <div>
                    ${codeEditorComponent('styleCode', model.body, 'typescript', 'updateStyleButton', null)}
                </div>
                <script>
                    document.getElementById('updateStyleButton').onclick = ev => {
                        document.getElementById('saveProgress').setAttribute('style','display:block');
                        document.getElementById('updateStyleButton').setAttribute('style','display:none');
                        const code = editor.getValue();
                        fetch('/project/${project}/modules/${module}/resources/models/${model.name}', {
                            method: 'POST',
                            headers: {
                                'content-type': 'application/json'
                            },
                            body: JSON.stringify({
                                body: code,
                                name: '${model.name}'
                            })
                        }).then(value => {
                           if (value.status !== 200) {
                               throw value.status + ' : ' + value.statusText.toString();
                           }else {
                               return value.json();
                           }
                        }).then(_=>{
                            // console.log(value);
                        }).catch(reason => {
                            console.log(reason);
                            alert(reason);
                        }).finally(() => {
                            document.getElementById('saveProgress').setAttribute('style','display:none');
                            document.getElementById('updateStyleButton').setAttribute('style','display:block');
                        });
                    }
                </script>
            </div>
        </div>
`
}

