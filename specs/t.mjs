import BfastUiAngular from "../bfast-ui-angular.mjs";

new BfastUiAngular().init().then(value => {
    return value.ide.start();
}).then(_ => {
    console.log('start successful');
}).catch(reason => {
    console.log(reason);
});
