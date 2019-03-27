module.exports = function () {

    var req = this.req;
    var res = this.res;
    const { WebhookClient } = require('dialogflow-fulfillment');
    // const {Card, Suggestion} = require('dialogflow-fulfillment');

    // connect firebase
    const agent = new WebhookClient({ request: req, response: res });


    var db = sails.firebaseAdmin.firestore();


    // FUNCTIONS FOR INTENTS
    async function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    async function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    // function for getting surgery data > ask doctor name(reponse);
    async function surgery(agent) {
        let conv = agent.conv();
        let params = agent.parameters;
        var surgery = params.surgery;
        console.log("The surgery name is " + surgery);
        agent.add('請問醫生名稱，如不知道，請輸入0');
    }






    // Show baseline case + all specific options with price.
    async function noDoctorName(agent) {
        var outputContexts = agent.context.get('outputcontexts');
        var contextSurgery = outputContexts.parameters.surgery;
        console.log(contextSurgery)
        // Search the document of the requested surgery from firebase
        var surgery = await db.collection('surgery').doc(contextSurgery).get();

        // Just for showing the order
        var abc = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        var count = 0;
        async function getOptions() {
            var output = await surgery.data().content + '基線案例收費通常為 $' + surgery.data().lowerBaselinePrice + " 至 $" + surgery.data().upperBaselinePrice + "，基線案例: ";
            //Get all collections of "Specific" document
            var optionsRef = await db.collection('surgery').doc(contextSurgery).collection('option').doc('specific').getCollections();
            var generalOptionsRef = await db.collection('general').doc('option').getCollections();
            //console.log(JSON.stringify(optionsRef));
            //Use for each to loop all collections > element = a collection
            for (const element of optionsRef) {
                var tempElement = await element.doc('1').get(); //First doc of each collection is the base case
                console.log("Specific內容是: " + tempElement.data()['內容']);
                output += await abc[count] + ": " + tempElement.data()['內容'] + ",  ";
                //output += await abc[count] + tempElement.data()['內容'] + ",  ";
                count++;
                console.log(output);
            }
            for (const generalElement of generalOptionsRef) {
                var tempElement = await generalElement.doc('1').get(); //First doc of each collection is the base case
                console.log("General內容是:" + tempElement.data()['內容']);
                // console.log("----" + tempElement.data().title);
                output += await abc[count] + tempElement.data()['內容'] + ",  ";
                //output += await abc[count] + tempElement.data()['內容'] + ",  ";
                count++;
                console.log(output);
            }

            output += "如想了解其他主要影響收費的選項及某些個案價的附加費，請按A-F選擇選項，或按[ok]查詢此手術的醫生名單。";
            return output;
        }

        var outputMessage = await getOptions();
        agent.add(outputMessage);

    }

    async function detail(agent) {
        var outputContexts = agent.context.get('outputcontexts');
        var contextSurgery = outputContexts.parameters.surgery;
        var contextOptions = outputContexts.parameters.options;

        var abc = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        var count = 0;
        async function getOptions() {
            var optionsRef = await db.collection('surgery').doc(contextSurgery).collection('option').doc('specific').getCollections();
            var generalOptionsRef = await db.collection('general').doc('option').getCollections();
            for (const element of optionsRef) {
                if (contextOptions === abc[count]) {
                    var optionDocs = await element.doc('1').get();
                    var optionDocs1 = await element.where('price', '>', 0).get();
                    console.log("optionDocs is " + optionDocs);
                    var output = await optionDocs.data()['content'] + '的其他選項如下: '
                    optionDocs1.forEach(doc => {
                        // console.log(doc.id);
                        // console.log(doc.data().price);
                        output += doc.id + '. ' + doc.data()['content'] + " : $" + doc.data().price + ".      ";
                    });
                }
                count++;
            }

            output +="如想了解其他主要影響收費的選項及某些個案價的附加費，請按0，或按[ok]查詢此手術的醫生名單。";
            return output
        }
        var outputMessage = await getOptions();
        agent.add(outputMessage);
    }

    async function doctorList(agent) {
        var outputContexts = agent.context.get('outputcontexts');
        console.log('outputContexts: ' + outputContexts);
        var contextSurgery = outputContexts.parameters.surgery;
        var surgery = await db.collection('surgery').doc(contextSurgery).get();
        var name = surgery.data()['content'];
        agent.add(await getDoctorList() + '，但個別醫生收費有異，而醫療服務收費昤會作出修改，而病人情況因人而異，如有需要請向你的醫生請教。本平台只搜集病人個案，會力求資料正確，內容只供參考之用，未得同意，不得作其他商業用途，唯最終資料準確性，請諮詢醫生及專業人仕。 若有其他的查詢和分享，請輸入"1" ; 若無，請輸入"2" ');

        async function getDoctorList() {
            var countNum = 1;
            var doctorList = "而根據其他病人分享的資料，做" + name + "且收費接近中位數的醫生有: ";
            var doctorDocs = await db.collection('surgery').doc(contextSurgery).collection('doctor').where('price', '<=', surgery.data().upperBaselinePrice).get();
            await doctorDocs.forEach(doc => {
                // console.log(doc.id);
                // console.log(doc.data().price);
                doctorList += countNum + "." + doc.data().name + " ";
                countNum++;
                console.log("The doctor list is : " + doctorList);
            });
            console.log("The end doctor list is : " + doctorList);
            return doctorList;

        }
    }
    async function noDoctorList(agent) {
        // let conv = agent.conv();
        // conv.followup('followup');
        // agent.add("nodoctorlist");
        const response = {
            followupEventInput: {
                name: "followup",
            }
        }
        return agent.response_.status(200).send(response);


    }
    async function doctorName(agent) {
        // let params = agent.parameters;
        // doctorName = params.doctorName;
        // console.log(agent.getContext('userprovidessurgery-followup'))
        // console.log("The doctor name is " + doctorName);
        // // getFulfillmentText(agent);
        // console.log("Surgery in doctor name intent: ");
        console.log('here')
    }

    async function hospital(agent) {
        let params = agent.parameters;
        hospital = params.hospital;
        console.log("The hospital is " + hospital);
        //console.log(">>>>"+)
        // console.log("INput context is: "+ req.body.outputContexts[2].surgery);

        agent.add('請輸入全單價錢(包括所有醫生/醫院收費)**');

    }
    async function price(agent) {
        var outputContexts = agent.context.get('outputcontexts');
        console.log('outputContexts: ' + outputContexts);
        var contextSurgery = outputContexts.parameters.surgery;
        var surgery = await db.collection('surgery').doc(contextSurgery).get();

        var abc = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        var count = 0;

        async function getOptions() {
            var output = await '此手術的基線案例為下:';
            //Get all collections of "Specific" document
            var optionsRef = await db.collection('surgery').doc(contextSurgery).collection('option').doc('specific').getCollections();
            var generalOptionsRef = await db.collection('general').doc('option').getCollections();
            //console.log(JSON.stringify(optionsRef));
            //Use for each to loop all collections > element = a collection
            for (const element of optionsRef) {
                var tempElement = await element.doc('1').get(); //First doc of each collection is the base case
                console.log("Specific內容是: " + tempElement.data()['content']);
                output += await abc[count] + tempElement.data()['content'] + ",  ";
                //output += await abc[count] + tempElement.data()['內容'] + ",  ";
                count++;
                console.log(output);
            }
            for (const generalElement of generalOptionsRef) {
                var tempElement = await generalElement.doc('1').get(); //First doc of each collection is the base case
                console.log("General內容是:" + tempElement.data()['content']);
                // console.log("----" + tempElement.data().title);
                output += await abc[count] + tempElement.data()['content'] + ",  ";
                //output += await abc[count] + tempElement.data()['內容'] + ",  ";
                count++;
                console.log(output);
            }

            return output + "                    ";
        }
        var outputMessage = await getOptions() + "如你的個案付合以上條件，請回覆[ok].否則請按A-F更改選項,或按[X]告訴我們你個案與一般手術不同的地方。";
        agent.add(outputMessage);

    }

    // async function option(agent){
    //     let params = agent.parameters;
    //     let decision = params.decision;
    //     console.log(decision)
    //     if (decision === 'ok'){
    //         console.log(typeof decision)
    //         console.log(decision)
    //         agent.add('請問醫生名稱，如不知道，請輸入');
    //     } else {
    //         // console.log(haha)
    //         // console.log(decision)
    //         agent.setFollowupEvent('looping');
    //     }
    //     console.log(typeof decision)
    // }

    async function option(agent) {
        var outputContexts = agent.context.get('outputcontexts');
        var contextOption = outputContexts.parameters.decision;
        var contextSurgery = outputContexts.parameters.surgery;

        async function getOptions() {
            var output = await '更改選項，你的個案不是';

            //Get all collections of "Specific" document
            var optionsRef = await db.collection('surgery').doc(contextSurgery).collection('option').doc('specific').collection(contextOption).get();
            // Use for each to loop all collections > element = a collection
            await optionsRef.forEach(doc => {
                if (doc.data().price == 0) {
                    output += doc.data().content + "。請選擇： ";
                } else {
                    output += doc.id + ". " + doc.data().content + " ";
                }
                // output += doc.data()['content'];
            });
            return output
        }
        var outputMessage = await getOptions() + " 不需更改請輸入[返回]。";
        agent.add(outputMessage);

    }

    async function modified(agent) {
        var outputContexts = agent.context.get('outputcontexts');
        var contextNumber = outputContexts.parameters.number;
        var contextOption = outputContexts.parameters.decision;
        var contextSurgery = outputContexts.parameters.surgery;

        async function getOptions() {
            var output = await '所以，你的案例為下: ';

            var abc = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            var count = 0;

            //Get all collections of "Specific" document
            var optionsRef = await db.collection('surgery').doc(contextSurgery).collection('option').doc('specific').getCollections();
            var generalOptionsRef = await db.collection('general').doc('option').getCollections();
            // Use for each to loop all collections > element = a collection
            for (const element of optionsRef) {

                var tempElement = await element.doc('1').get(); //First doc of each collection is the base case
                console.log("Specific內容是: " + tempElement.data()['content']);
                output += await abc[count] + tempElement.data()['content'] + ",  ";
                //output += await abc[count] + tempElement.data()['內容'] + ",  ";
                count++;
                console.log(output);
            }
            return output
        }
        var outputMessage = await getOptions() + " 不需更改請輸入[返回]。";
        agent.add(outputMessage);

    }
    async function followup(agent) {

    }
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('user provides surgery', surgery);
    intentMap.set('user provides doctor name', doctorName);
    intentMap.set('user does not provide doctor name', noDoctorName)
    intentMap.set('user wants to know more info', detail)
    intentMap.set('shows the doctor list', doctorList);
    intentMap.set('followup', followup);
    intentMap.set('user modifies options', option);
    intentMap.set('show modified options', modified);
    // intentMap.set('system shows options', shows);
    // intentMap.set('user provides hospital', hospital);
    intentMap.set('user provides price', price);
    // intentMap.set('user does not want to see doctor list', noDoctorList);
    // intentMap.set('user does not provide doctor name', noDoctorName);
    // intentMap.set('user wants to see doctor list', doctorlist);
    // intentMap.set('follow up', followUp);
    agent.handleRequest(intentMap);
    // // intentMap.set('<INTENT_NAME_HERE>', yourFunctionHandler);
    // // intentMap.set('<INTENT_NAME_HERE>', googleAssistantHandler);
    // agent.handleRequest(intentMap);

    // intentMap.set('user provides surgery', (agent) => {
    //     let conv = agent.conv();
    //     console.log(":::::::::::::::::::::::");
    //     console.log(conv);
    //     let params = agent.parameters;
    //     surgery = params.surgery;
    //     console.log("The surgery is "+surgery);

    //     return agent.add('請輸入負責手術的醫生名字，如不知道請輸入"0"**');

    // });
    // intentMap.set('user provides doctor name', (agent) => {
    //     let conv = agent.conv();
    //     let params = agent.parameters;
    //     doctorName = params.doctorName;
    //     console.log("The doctor name is "+doctorName);
    //     // getFulfillmentText(agent);
    //     console.log("Surgery in doctor name intent: ");
    //     return agent.add('請問醫院名稱**');

    // });
    // intentMap.set('user provides hospital', (agent) => {
    //     let conv = agent.conv();
    //     let params = agent.parameters;
    //     hospital = params.hospital;
    //     console.log("The hospital is "+hospital);
    //     //console.log(">>>>"+)
    //     console.log("INput context is: "+ req.body.outputContexts[2].surgery);

    //     return conv.close('請輸入全單價錢(包括所有醫生/醫院收費)**');

    // });
    // intentMap.set('user provides price', (agent) => {
    //     let conv = agent.conv();
    //     let params = agent.parameters;
    //     price = params.price;
    //     console.log("The price is "+ price);
    // for(var key in surgery_summary)break;
    // var temp = surgery_summary[key];
    // console.log("11111111."+temp);
    // // var output = "所以，你地案例為下：\n"
    // // // console.log(output);
    // // console.log("@@@@@@@@");
    // // console.log(gastroscopy_summary.B);
    // // for(var key in gastroscopy_summary){
    // //     var temp = gastroscopy_summary[key];
    // //     console.log("*******"+temp);
    // //    console.log(temp[1].name);
    // //    const optionsList = list.map(item => Object.values(item)[0]);
    // // }
    // var count = 0;
    // for(var key in gastroscopy_summary){
    //     output += (abc[count] +": "+gastroscopy_summary[key][1].name+"\n");
    //     count++;
    // }
    // // console.log(output);
    // return conv.close("Display the surgery summary");

    // });
    // intentMap.set('user modifies details', (agent) => {
    //     let conv = agent.conv();

    // });


}