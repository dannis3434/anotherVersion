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
        // var outputContexts = agent.context.get('outputcontexts');
        var db = sails.firebaseAdmin.firestore();
        var contextOptions = 'A';
        var contextSurgery = '58';
   
        async function getOptions() {

            var output = await '所以，你的案例為下: ';

            var abc = ['A', 'B', 'C', 'D', 'E', 'F','G','H','I','J', 'K','L','M' ,'N','O','P','Q','R','S', 'T','U','V','W','X','Y','Z'];
            var count = 0;
            
            //Get all collections of "Specific" document
            var optionsRef = await db.collection('surgery').doc(contextSurgery).collection('option').doc('specific').getCollections();
            // var generalOptionsRef = await db.collection('general').doc('option').getCollections();
            // Use for each to loop all collections > element = a collection
            for (const element of optionsRef) {
                if (contextOptions === abc[count]){
                    var optionDocs = await element.doc('1').get();
                    var optionDocs1 = await element.where('price', '>' , 0).get();
                    console.log("optionDocs is " + optionDocs);
                    var output = await optionDocs.data()['content'] + '的其他選項如下: '
                    optionDocs1.forEach(doc => {
                            // console.log(doc.id);
                            // console.log(doc.data().price);
                            output += doc.id+'. '+ doc.data()['content'] +" : $" +doc.data().price +".      ";
                        });
                }
                count++;
            }
            
                return output
            }

        // var outputMessage =await getOptions()+"如你的個案付合以上條件，請回覆[ok].否則請按A-F更改選項,或按[X]告訴我們你個案與一般手術不同的地方。";
        // agent.add(outputMessage);
        var outputMessage =await getOptions();
        console.log(outputMessage)
        return res.ok();

    }
    
}
// }
