/**
 * MainController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    fulfill: async function (req, res) {
        return res.fulfillment();
    },
    index2: async function (req, res) {
        var db = sails.firebaseAdmin.firestore();
        // var outputContexts = agent.context.get('outputcontexts');
            // var outputContexts = agent.context.get('outputcontexts');
            var contextSurgery = '58'; 
    console.log(contextSurgery)
            // Search the document of the requested surgery from firebase
             var surgery = await db.collection('surgery').doc(contextSurgery).get();
    
            // Just for showing the order
            var abc = ['A', 'B', 'C', 'D', 'E', 'F','G','H','I','J', 'K','L','M' ,'N','O','P','Q','R','S', 'T','U','V','W','X','Y','Z'];
            var count = 0;
            async function getOptions() {
                var output = await surgery.data().content + '基線案例收費通常為' + surgery.data().lowerBaselinePrice + "至" + surgery.data().upperBaselinePrice + "，基線案例: ";
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
        // var outputMessage =await getOptions()+"如你的個案付合以上條件，請回覆[ok].否則請按A-F更改選項,或按[X]告訴我們你個案與一般手術不同的地方。";
        // agent.add(outputMessage);
        var outputMessage =await getOptions();
        console.log(outputMessage)
        return res.ok();

    }
    
}
// }
