module.exports = function () {

    var req = this.req;
    var res = this.res;
    const { WebhookClient } = require('dialogflow-fulfillment');
    // const {Card, Suggestion} = require('dialogflow-fulfillment');

    // connect firebase
    const agent = new WebhookClient({ request: req, response: res });


    var db = sails.firebaseAdmin.firestore();

    async function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    async function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    async function noDoctorName(agent) {
        var outputContexts = agent.context.get('outputcontexts');
        var contextSurgery = outputContexts.parameters.surgery; 
console.log(contextSurgery)
        // Search the document of the requested surgery from firebase
         var surgery = await db.collection('surgery').doc(contextSurgery).get();

        // Just for showing the order
        var abc = ['A', 'B', 'C', 'D', 'E', 'F','G','H','I','J', 'K','L','M' ,'N','O','P','Q','R','S', 'T','U','V','W','X','Y','Z'];
        var count = 0;
        async function getOptions() {
            var output = await ChineseName + '基線案例收費通常為' + surgery.data().lowerBaselinePrice + "至" + surgery.data().upperBaselinePrice + "，基線案例: ";
            //Get all collections of "Specific" document
            var optionsRef = await db.collection('surgery').doc(contextSurgery).collection('option').doc('specific').getCollections();
            var generalOptionsRef = await db.collection('general').doc('option').getCollections();
            //console.log(JSON.stringify(optionsRef));
            //Use for each to loop all collections > element = a collection
            for (const element of optionsRef) {
                var tempElement = await element.doc('1').get(); //First doc of each collection is the base case
                console.log("Specific內容是: " + tempElement.data()['內容']);
                output += await abc[count] + tempElement.data()['內容'] + ",  ";
                //output += await abc[count] + tempElement.data()['內容'] + ",  ";
                count++;
                console.log(output);
            }
            for (const generalElement of generalOptionsRef) {
                var tempElement = await generalElement.doc('1').get(); //First doc of each collection is the base case
                console.log("General內容是:"  + tempElement.data()['內容']);
               // console.log("----" + tempElement.data().title);
                output += await abc[count] + tempElement.data()['內容'] + ",  ";
                //output += await abc[count] + tempElement.data()['內容'] + ",  ";
                count++;
                console.log(output);
            }

            output += "如想了解其他主要影響收費的選項及某些個案價的附加費，請按A-F選擇選項，或按[ok]查詢此手術的醫生名單。";
            return output;
        }

        var outputMessage =await getOptions();
        agent.add(outputMessage);

    }
    

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    // intentMap.set('user provides doctor name', doctorName);
    intentMap.set('user does not provide doctor name', noDoctorName)
    
    // intentMap.set('followup', followup);
    // intentMap.set('user modifies options', option);
    // intentMap.set('show modified options', modified);
    // intentMap.set('system shows options', shows);
    // intentMap.set('user provides hospital', hospital);
    // intentMap.set('user provides price', price);
    // intentMap.set('user wants to see doctor list', doctorList);
    // intentMap.set('user does not want to see doctor list', noDoctorList);
    // intentMap.set('user does not provide doctor name', noDoctorName);
    // intentMap.set('user wants to see doctor list', doctorlist);
    // intentMap.set('follow up', followUp);
    agent.handleRequest(intentMap);
}