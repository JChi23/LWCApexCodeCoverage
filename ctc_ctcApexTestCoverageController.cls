public with sharing class ctc_ctcApexTestCoverageController {
    @AuraEnabled
    public static List<ApexClass> getClasses(Id listview, string namedCred){
        try {
            System.debug('Getting classes');
            if(string.isBlank(listview)){
                //return null;
                return [SELECT Id, Name, CreatedBy.Name, LastModifiedBy.Name FROM ApexClass ORDER BY Name LIMIT 300];

            } else {
                
                Http http = new Http();
                HttpRequest request = new HttpRequest();
                //request.setEndpoint('https://brave-badger-oaqjb6-dev-ed.my.salesforce.com/services/data/v53.0/sobjects/Account/listviews/00B8c00000PF56PEAT/describe');
                string callout = string.format('{0}{1}{2}{3}{4}',new string[]{'callout:',namedCred,'/services/data/v53.0/tooling/sobjects/ApexClass/listviews/',listview,'/describe'});
                //request.setEndpoint('callout:TestCovCred/services/data/v53.0/sobjects/Account/listviews/00B8c00000PF56PEAT/describe');
                System.debug('listview callout ' + callout);
                request.setEndpoint(callout);
                request.setMethod('GET');
                //request.setHeader('Content-Type', 'application/json;charset=UTF-8');
                request.setHeader('Authorization', 'Bearer {!$' + namedCred + '.OAuthToken}'); 
                //request.setBody('{"Event":"Thing Returned"}');
                HttpResponse response = http.send(request);
                // If the request is successful, parse the JSON response.
                System.debug('status code: ' + response.getStatusCode());
                if(response.getStatusCode() == 200) {
                    // Deserialize the JSON string into collections of primitive data types.
                    Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                    // Cast the values in the 'animals' key as a list
                    //List<Object> animals = (List<Object>) results.get('query');
                    //System.debug(results.get('query')); WHERE Id NOT IN (SELECT TracedEntityId FROM TraceFlag)
                    string returnedQuery = '' + results.get('query');//might need to do another callout because listview query uses metadata
                    //System.debug('check '+returnedQuery.contains('ENTITY_TRACE'));
                    if (returnedQuery.contains('ENTITY_TRACE')){
                        //System.debug(returnedQuery.substring(returnedQuery.indexOf('ENTITY_TRACE'),returnedQuery.indexOf('ENTITY_TRACE')+20) + ' test ' + returnedQuery.substring(returnedQuery.indexOf('ENTITY_TRACE'),returnedQuery.indexOf('ENTITY_TRACE')+20).contains('true'));
                        if (returnedQuery.substring(returnedQuery.indexOf('ENTITY_TRACE'),returnedQuery.indexOf('ENTITY_TRACE')+20).contains('true')) {
                            returnedQuery = returnedQuery.replace('ENTITY_TRACE = true','Id IN (SELECT TracedEntityId FROM TraceFlag)');
                        }else {
                            returnedQuery = returnedQuery.replace('ENTITY_TRACE = false','Id NOT IN (SELECT TracedEntityId FROM TraceFlag)');
                        }
                        System.debug(returnedQuery);
                        string query = 'SELECT Id, Name, CreatedBy.Name, LastModifiedBy.Name'+returnedQuery.substring(returnedQuery.indexOf(' FROM '));
                        query = query.replace(', ','+,+');
                        callout = string.format('{0}{1}{2}{3}',new string[]{'callout:',namedCred,'/services/data/v53.0/tooling/query/','?q=' + (query.replace(' ', '+'))});
                        request.setEndpoint(callout);
                        HttpResponse classResponse = http.send(request);
                        System.debug('query: ' + callout);
                        System.debug('code coverage status: ' + classResponse.getStatusCode());
                        if(classResponse.getStatusCode() == 200) { 
                            List<Id> classIds = new List<Id>();
                            Map<String, Object> classResults = (Map<String, Object>) JSON.deserializeUntyped(classResponse.getBody());
                            //List<ApexClass> finalReturn = (List<ApexClass>) classResults.get('records');
                            for(Object obj: (List<Object>) classResults.get('records')){
                                Map<String, Object> objMap = (Map<String, Object>) obj;
                                classIds.add((Id) objMap.get('Id'));
                            }
                            List<ApexClass> finalReturn = [SELECT Id, Name, CreatedBy.Name, LastModifiedBy.Name FROM ApexClass WHERE Id IN :classIds ORDER BY Name];
                            System.debug('list: ' + finalReturn);
                            return finalReturn;
                        } else {
                            return null;
                        }
                    } else {

                        string query = 'SELECT Id, Name, CreatedBy.Name, LastModifiedBy.Name'+returnedQuery.substring(returnedQuery.indexOf(' FROM '));
                        System.debug(query);
                        List<ApexClass> returner = Database.query(query);
                        return returner;
                    }


                } else {
                    return null;
                }
                //return response.getBody();

            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<ApexTrigger> getTriggers(Id listview, string namedCred){
        try {
            System.debug('Getting triggers');
            if(string.isBlank(listview)){
                return [SELECT Id, Name, CreatedBy.Name, LastModifiedBy.Name FROM ApexTrigger ORDER BY Name];
            } else {
                Http http = new Http();
                HttpRequest request = new HttpRequest();
                string callout = string.format('{0}{1}{2}{3}{4}',new string[]{'callout:',namedCred,'/services/data/v53.0/tooling/sobjects/ApexTrigger/listviews/',listview,'/results'});
                System.debug('trigger listview callout ' + callout);
                request.setEndpoint(callout);
                request.setMethod('GET');
                request.setHeader('Authorization', 'Bearer {!$' + namedCred + '.OAuthToken}'); 
                HttpResponse response = http.send(request);
                // If the request is successful, parse the JSON response.
                System.debug('status code: ' + response.getStatusCode() + ' | response: ' + response.getBody());
                if(response.getStatusCode() == 200) {
                    Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                    // Deserialize the JSON string into collections of primitive data types.
                    //List<ApexTrigger> finalReturn = (List<ApexTrigger>) results.get('records');
                    List<ApexTrigger> finalReturn = new List<ApexTrigger>();
                    //System.debug('records: ' + results.get('records'));
                    //Map<String, Object> test = (Map<String, Object>) results.get('records');
                    System.debug('hey');
                    List<Id> triggerList = new List<Id>();
                    for( Object obj : (List<Object>) results.get('records')) {
                        Map<String, Object> objMap = (Map<String, Object>) obj;
                        for(Object obj3 : (List<Object>) objMap.get('columns')){
                            Map<String, Object> obj3Map = (Map<String, Object>) obj3;
                            System.debug('' + obj3Map.get('fieldNameOrPath') + '|' + triggerList);
                            if(obj3Map.get('fieldNameOrPath') == 'Id'){
                                triggerList.add((Id) obj3Map.get('value'));
                            } 
                        }
                    }
                    finalReturn = [SELECT Id, Name, CreatedBy.Name, LastModifiedBy.Name FROM ApexTrigger WHERE Id IN :triggerList ORDER BY Name];
                    System.debug('list: ' + finalReturn);
                    return finalReturn;


                } else {
                    List<Object> results = (List<Object>) JSON.deserializeUntyped(response.getBody());
                    String errorMsg = '';
                    for(Object obj : results){
                        Map<String, Object> objMap = (Map<String, Object>) obj;
                        System.debug('message: ' + objMap.get('message'));
                        errorMsg += objMap.get('message');
                    }
                    if (errorMsg.contains('ENTITY_TRACE')){
                        //System.debug(returnedQuery.substring(returnedQuery.indexOf('ENTITY_TRACE'),returnedQuery.indexOf('ENTITY_TRACE')+20) + ' test ' + returnedQuery.substring(returnedQuery.indexOf('ENTITY_TRACE'),returnedQuery.indexOf('ENTITY_TRACE')+20).contains('true'));
                        if (errorMsg.substring(errorMsg.indexOf('ENTITY_TRACE'),errorMsg.indexOf('ENTITY_TRACE')+20).contains('true')) {
                            errorMsg = errorMsg.replace('ENTITY_TRACE = true','Id IN (SELECT TracedEntityId FROM TraceFlag)');
                        }else {
                            errorMsg = errorMsg.replace('ENTITY_TRACE = false','Id NOT IN (SELECT TracedEntityId FROM TraceFlag)');
                        }
                        System.debug(errorMsg);
                        string query = 'SELECT Id, Name, CreatedBy.Name, LastModifiedBy.Name'+errorMsg.substring(errorMsg.indexOf(' FROM '),errorMsg.indexOf('\n',errorMsg.indexOf(' FROM ')));
                        query = query.replace(', ','+,+');
                        callout = string.format('{0}{1}{2}{3}',new string[]{'callout:',namedCred,'/services/data/v53.0/tooling/query/','?q=' + (query.replace(' ', '+'))});
                        request.setEndpoint(callout);
                        HttpResponse triggerResponse = http.send(request);
                        System.debug('trigger query: ' + callout);
                        System.debug('code coverage status: ' + triggerResponse.getStatusCode());
                        if(triggerResponse.getStatusCode() == 200) { 
                            Map<String, Object> triggerResults = (Map<String, Object>) JSON.deserializeUntyped(triggerResponse.getBody());
                            List<Id> triggerIds = new List<Id>();
                            for(Object obj: (List<Object>) triggerResults.get('records')){
                                Map<String, Object> objMap = (Map<String, Object>) obj;
                                triggerIds.add((Id) objMap.get('Id'));
                            }
                            List<ApexTrigger> finalReturn = [SELECT Id, Name, CreatedBy.Name, LastModifiedBy.Name FROM ApexTrigger WHERE Id IN :triggerIds ORDER BY Name];
                            return finalReturn;
                        } else {
                            return null;
                        }
                    } else {
                        return null;
                    }
                }
                

            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    
    @AuraEnabled
    public static string getTestCoverage(List<Id> classOrTriggerIds, string namedCred){
        try {
            //return [SELECT Id, NumLinesCovered, NumLinesUncovered, ApexClassorTriggerId FROM ApexCodeCoverage WHERE ApexClassorTriggerId IN :classOrTriggerIds ORDER BY ApexClassorTrigger.Name];
            //SELECT+Id+,+NumLinesCovered+,+NumLinesUncovered+,+ApexClassorTriggerId+FROM+ApexCodeCoverage+ORDER+BY+ApexClassorTrigger.Name
            string idList = '';
            for (Id classTriggId : classOrTriggerIds){
                idList += '\'' + classTriggId + '\',';
            }
            idList = idList.removeEnd(',');
            string query = 'SELECT Id, NumLinesCovered, NumLinesUncovered, ApexClassorTriggerId, ApexClassorTrigger.Name FROM ApexCodeCoverageAggregate ORDER BY ApexClassorTrigger.Name';
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            //request.setEndpoint('https://brave-badger-oaqjb6-dev-ed.my.salesforce.com/services/data/v53.0/sobjects/Account/listviews/00B8c00000PF56PEAT/describe');
            query = query.replace(', ','+,+');
            string callout = string.format('{0}{1}{2}{3}',new string[]{'callout:',namedCred,'/services/data/v53.0/tooling/query/?q=' , (query.replace(' ', '+'))});
            System.debug(callout);
            //request.setEndpoint('callout:TestCovCred/services/data/v53.0/sobjects/Account/listviews/00B8c00000PF56PEAT/describe');
            request.setEndpoint(callout);
            request.setMethod('GET');
            //request.setHeader('Content-Type', 'application/json;charset=UTF-8');
            request.setHeader('Authorization', 'Bearer {!$' + namedCred + '.OAuthToken}'); 
            //request.setBody('{"Event":"Thing Returned"}');
            HttpResponse response = http.send(request);
            // If the request is successful, parse the JSON response.
            System.debug('code coverage status: ' + response.getStatusCode());
            if(response.getStatusCode() == 200) { //could we optimize by sorting out classes here
                return response.getBody();
            } else {
                return null;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<ListView> getListviews(){
        try {
            return [SELECT Id, LastModifiedBy.Name, Name, SobjectType  FROM ListView WHERE (SobjectType = 'ApexClass' OR SobjectType = 'ApexTrigger')];

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string test(Id listview){
        try {   
            return '';
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<ApexTestRunResult> getTestRunResults(){
        try {
            return [SELECT Id, CreatedBy.Name, CreatedDate, AsyncApexJobId FROM ApexTestRunResult]; 
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<ApexTestResult> getTestClasses(Id testRunResult){
        try {
            return [SELECT ApexClassId, MethodName, ApexClass.Name, ApexClass.CreatedBy.Name, ApexClass.LastModifiedBy.Name, Outcome, Message FROM ApexTestResult WHERE ApexTestRunResultId = :testRunResult];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

   

    public ctc_ctcApexTestCoverageController() {

    }
}