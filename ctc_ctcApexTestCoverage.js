// Jeffrey Chi - 8/2022
// Built at West Monroe
// This component pulls and compiles code coverage for classes and triggers as well as  displays test results. One can also export data to a formatted excel sheet.
import { LightningElement, track } from 'lwc';
import { loadScript } from "lightning/platformResourceLoader";
import workbook from "@salesforce/resourceUrl/writeExcel";
import getClasses from "@salesforce/apex/ctc_ctcApexTestCoverageController.getClasses";
import getListviews from "@salesforce/apex/ctc_ctcApexTestCoverageController.getListviews";
import getTestRunResults from "@salesforce/apex/ctc_ctcApexTestCoverageController.getTestRunResults";
import getTestClasses from "@salesforce/apex/ctc_ctcApexTestCoverageController.getTestClasses";
import getTestCoverage from "@salesforce/apex/ctc_ctcApexTestCoverageController.getTestCoverage";
import getTriggers from "@salesforce/apex/ctc_ctcApexTestCoverageController.getTriggers";
//import COLORS from '@salesforce/resourceUrl/colors'

//follow this link for instructions on auth provider, connected apps, and named creds: https://mukulmahawariya11.medium.com/beginners-guide-to-api-calls-from-salesforce-lightning-web-components-65af2ab7c629
//resources for write-excel-file.js: https://npm.io/package/write-excel-file
//https://www.npmjs.com/package/write-excel-file?activeTab=readme
//https://learn.habilelabs.io/salesforce-export-to-excel-with-lightning-web-component-875b3f4b7e53

const apexClassColumns = [
    { label: 'Class Name', fieldName: 'Name', sortable: 'true' },
    { label: 'Lines Covered', fieldName: 'linesCovered'},
    { label: 'Percent Coverage', fieldName: 'pctCovered', sortable: 'true', cellAttributes:{
        class:{fieldName:'pctColor'}
    }},
    { label: 'Last Modified By', fieldName: 'modified'},
    { label: 'Created By', fieldName: 'created'},
];

const apexTriggerColumns = [
    { label: 'Trigger Name', fieldName: 'Name', sortable: 'true' },
    { label: 'Lines Covered', fieldName: 'linesCovered'},
    { label: 'Percent Coverage', fieldName: 'pctCovered', sortable: 'true', cellAttributes:{
        class:{fieldName:'pctColor'}
    }},
    { label: 'Last Modified By', fieldName: 'modified'},
    { label: 'Created By', fieldName: 'created'},
];

const testClassColumns = [
    { label: 'Test Class Name', fieldName: 'classname', sortable: 'true' },
    { label: 'Method Name', fieldName: 'MethodName'},
    { label: 'Outcome', fieldName: 'Outcome', sortable: 'true', cellAttributes:{
        class:{fieldName:'outcomeColor'}
    }},
    { label: 'Error Message', fieldName: 'Message'},
    { label: 'Last Modified By', fieldName: 'modified'},
    { label: 'Created By', fieldName: 'created'},
];

const topRow = [
    {
        value: 'Apex Test Classes',
        fontWeight: 'bold'
    }, 
    {value: ''},{value: ''},{value: ''},{value: ''},{value: ''},{value: ''},{value: ''},{value: ''},
    {
        value: 'Apex Classes',
        fontWeight: 'bold'
    },
    {value: ''},{value: ''},{value: ''},{value: ''},{value: ''},{value: ''},
    {
        value: 'Apex Triggers',
        fontWeight: 'bold'
    }
];
const headerRow = [
    {
        value: 'Class Name',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    }, 
    {
        value: 'Method Name',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Result',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Error Message',
        color: '#575F65',
        wrap: true,
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Last Modified By',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Created By',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },{value: '',backgroundColor: '#A2C4DB'},{value: '',backgroundColor: '#A2C4DB'},{value: '',backgroundColor: '#A2C4DB'},
    {
        value: 'Class Name',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Lines Covered',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Code Covered',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Last Modified By',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Created By',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },{value: '',backgroundColor: '#A2C4DB'},{value: '',backgroundColor: '#A2C4DB'},
    {
        value: 'Class Name',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Lines Covered',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Code Covered',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Last Modified By',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    },
    {
        value: 'Created By',
        color: '#575F65',
        backgroundColor: '#A2C4DB'
    }
];

const columns = [
{width: 35},{width: 35},{width: 15},{width: 85},{width: 25},{width: 25},{},{},{width: 35},
{width: 35},{width: 15},{width: 15},{width: 25},{width: 25},{},{},
{width: 35},{width: 15},{width: 15},{width: 25},{width: 25},
]
  


export default class Ctc_ctcApexTestCoverage extends LightningElement {
    topRow = topRow;
    headerRow = headerRow;
    columns = columns;

    imageURL;
    librariesLoaded = false;
    data = [];
    @track apexClassColumns = apexClassColumns;
    @track testClassColumns = testClassColumns;
    @track apexTriggerColumns = apexTriggerColumns;
    value = '';

    @track sortClassBy;
    @track sortClassDirection;
    @track sortBy;
    @track sortDirection;

    testruns = [];
    namedCred = 'TestCovCred';
    outputFile = 'Code Coverage Report';
    @track totalPctCovered = [0,1];
    @track classPctCovered = [0,1];
    @track triggerPctCovered = [0,1];
    @track classListviews = [];
    @track triggerListviews = [];
    @track testRunResults = [];
    @track listviewId;
    @track triggerListviewId;
    @track testRunResultId;
    @track testClasses = [];
    @track apexClasses;
    @track apexTriggers;


    connectedCallback() {
        getListviews().then(result => {
            let tempClass = [];
            let tempTrigger = [];
            tempClass.push({ label: 'All', value: ''});
            tempTrigger.push({ label: 'All', value: ''});
            for(let res of result){
                console.log('got apex classes', res.SobjectType);
                if(res.SobjectType === 'ApexClass'){
                    console.log('pushing: ' + res.Name + ', Last Modified By ' + res.LastModifiedBy.Name);
                    tempClass.push({ label: (res.Name + ', Last Modified By ' + res.LastModifiedBy.Name), value: res.Id});
                } else {
                    tempTrigger.push({ label: (res.Name + ', Last Modified By ' + res.LastModifiedBy.Name), value: res.Id});
                }
            }
            this.classListviews = [...tempClass];
            this.triggerListviews = [...tempTrigger];
        }).catch(error=>
        {
            console.error('check listview error here', error);
        });

        getTestRunResults().then(result => {
            let tempResults = [];
            for(let res of result){
                tempResults.push({ label: ('Apex Job ' + res.AsyncApexJobId + ' Ran by ' + res.CreatedBy.Name + ' at ' + res.CreatedDate), value: res.Id});
            }
            this.testRunResults = [...tempResults];
        }).catch(error=>
        {
            console.error('check test run results error here', error);
        });

        getClasses({listview: this.listviewId, namedCred: this.namedCred}).then((response) => {
            this.apexClasses = response;
            let classIds = [];
            for(let res of response){
                classIds.push(res.Id);
            }
            //console.log("###Response : " + response);
            // let parsedData = JSON.parse(response);
            // this.imageURL = parsedData.query;
            // console.log(this.imageURL);
            return getTestCoverage({classOrTriggerIds: classIds, namedCred: this.namedCred});
        }).then((response) => {
            let i = 0;
            let parsedData = JSON.parse(response);
            let tempClasses = [...this.apexClasses];
            let classLinesCovered = 0;
            let classLinesUncovered = 0;
            for(let apexClass of tempClasses){
                while(i < parsedData.records.length &&  (parsedData.records[i].ApexClassOrTriggerId.startsWith('01q') || parsedData.records[i].ApexClassOrTrigger.Name.toLowerCase() < apexClass.Name.toLowerCase())){
                    i++;
                }
                
                if(i < parsedData.records.length && parsedData.records[i].ApexClassOrTriggerId === apexClass.Id){
                    let totalLines = (parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered) === 0 ? 1 : parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered;
                    classLinesCovered += parsedData.records[i].NumLinesCovered;
                    classLinesUncovered += parsedData.records[i].NumLinesUncovered;
                    apexClass.linesCovered = parsedData.records[i].NumLinesCovered + '/' + (parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered);
                    apexClass.pctCovered = ((parsedData.records[i].NumLinesCovered * 100) / totalLines) + '%';
                    apexClass.pctColor = ((parsedData.records[i].NumLinesCovered * 100) / totalLines) >= 85 ? "slds-text-color_success":"slds-text-color_error";
                    i++;
                } else {
                    apexClass.linesCovered = 0;
                    apexClass.pctCovered = '0%';
                    apexClass.pctColor = "slds-text-color_weak";
                }

                apexClass.modified = apexClass.LastModifiedBy.Name;
                apexClass.created = apexClass.CreatedBy.Name;
            }
            this.classPctCovered[0] = classLinesCovered;
            this.classPctCovered[1] = classLinesUncovered;
            
            this.apexClasses = [...tempClasses];
            console.log('apex classes: ', this.apexClasses.length, this.apexClasses);
        }).catch(error=>
        {
            console.error('check test coverage error here', error);
        });


        getTriggers({listview: this.triggerListviewId, namedCred: this.namedCred}).then((response) => {
            this.apexTriggers = response;
            let triggerIds = [];
            for(let res of response){
                triggerIds.push(res.Id);
                if(typeof res.LastModifiedBy === 'undefined'){
                    res.LastModifiedBy = res.CreatedBy;
                }
                //console.log('apex trigger: ', res.Name, 'LMB: ',res.LastModifiedBy, ' CB: ',res.CreatedBy);
            }
            return getTestCoverage({classOrTriggerIds: triggerIds, namedCred: this.namedCred});
        }).then((response) => {
            let i = 0;
            let parsedData = JSON.parse(response);
            let tempTriggers = [...this.apexTriggers];
            let triggerLinesCovered = 0;
            let triggerLinesUncovered = 0;
            for(let apexTrigger of tempTriggers){
                while(i < parsedData.records.length &&  (parsedData.records[i].ApexClassOrTriggerId.startsWith('01p') || parsedData.records[i].ApexClassOrTrigger.Name.toLowerCase() < apexTrigger.Name.toLowerCase())){
                    i++;
                }
                if(i < parsedData.records.length && parsedData.records[i].ApexClassOrTriggerId === apexTrigger.Id){
                    let totalLines = (parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered) === 0 ? 1 : parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered;
                    triggerLinesCovered += parsedData.records[i].NumLinesCovered;
                    triggerLinesUncovered += parsedData.records[i].NumLinesUncovered;
                    apexTrigger.linesCovered = parsedData.records[i].NumLinesCovered + '/' + (parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered);
                    apexTrigger.pctCovered = ((parsedData.records[i].NumLinesCovered * 100) / totalLines) + '%';
                    apexTrigger.pctColor = ((parsedData.records[i].NumLinesCovered * 100) / totalLines) >= 85 ? "slds-text-color_success":"slds-text-color_error";
                    i++;
                } else {
                    apexTrigger.linesCovered = 0;
                    apexTrigger.pctCovered = '0%';
                    apexTrigger.pctColor = "slds-text-color_weak";
                }
                apexTrigger.modified = apexTrigger.LastModifiedBy.Name;
                apexTrigger.created = apexTrigger.CreatedBy.Name;
            }
            this.triggerPctCovered[0] = triggerLinesCovered;
            this.triggerPctCovered[1] = triggerLinesUncovered;

            this.apexTriggers = [...tempTriggers];
        }).catch(error=>
        {
            console.error('check trigger coverage error here', error);
        });
    }



    objectsData = [
        // Object #1
        {
            name: 'John Smith',
            dateOfBirth: new Date(),
            cost: 1800,
            paid: true
        },
        // Object #2
        {name: '', dateOfBirth: '', cost: ''},
        {
            name: 'Alice Brown Alice Brown Alice Brown Alice Brown Alice Brown Alice Brown',
            dateOfBirth: new Date(),
            cost: 2600,
            paid: false
        }
    ]
    schemaObj = [
        // Column #1
        {
            column: 'Name',
            type: String,
            wrap: 'true',
            color: '#ccaaaa',
            width: 40,
            value: student => student.name
        },
        // Column #2
        {
            column: 'Date of Birth',
            type: Date,
            format: 'mm/dd/yyyy',
            value: student => student.dateOfBirth
        },
        // Column #3
        {
            column: 'Cost',
            type: Number,
            format: '#,##0.00',
            value: student => student.cost
        },
        // Column #4
        {
            column: 'Paid',
            type: Boolean,
            value: student => student.paid
        }
    ]
    renderedCallback() {
        console.log("renderedCallback");
        if (this.librariesLoaded) return;
        this.librariesLoaded = true;
        loadScript(this, workbook + "/writeExcel/write-excel-file.min.js")
            .then(async (data) => {
                console.log("success------>>>", data);
            })
            .catch(error => {
                console.log("failure-------->>>>", error);
            });
    }
    // calling the download function from xlsxMain.js
    async download() {
        let _self = this;
        // When passing `objects` and `schema`.
        // await writeXlsxFile(_self.objectsData, {
        //     schema: _self.schemaObj,
        //     fileName: 'test.xlsx'
        // })

        console.log("doc gen");
        let data = [_self.topRow, _self.headerRow];
        let index = 0;

        while(index < _self.apexClasses.length || index < _self.apexTriggers.length || index < _self.testClasses.length) {
            let row = [];
            if (index < _self.testClasses.length) {
                row.push({value: _self.testClasses[index].classname }, {value: _self.testClasses[index].MethodName});
                if (_self.testClasses[index].Outcome === 'Pass') {
                    row.push({value: _self.testClasses[index].Outcome});
                } else {
                    row.push({value: _self.testClasses[index].Outcome, color: '#9A2826', backgroundColor: '#F6C9CE'});
                }
                row.push({value: _self.testClasses[index].Message, wrap: true},{value: _self.testClasses[index].modified},{value: _self.testClasses[index].created});
            } else {
                row.push({value: ''},{value: ''},{value: ''},{value: ''},{value: ''},{value: ''});
            }

            row.push({value: ''},{value: ''},{value: ''});

            if (index < _self.apexClasses.length) {
                row.push({value: _self.apexClasses[index].Name}, {value: _self.apexClasses[index].linesCovered});
                if (_self.apexClasses[index].pctColor === 'slds-text-color_success') {
                    row.push({value: parseInt(_self.apexClasses[index].pctCovered, 10), type: Number, format: '##0\\%'})
                } else {
                    row.push({value: parseInt(_self.apexClasses[index].pctCovered, 10), color: '#9A2826', backgroundColor: '#F6C9CE', type: Number, format: '##0\\%'})
                }
                row.push({value: _self.apexClasses[index].modified},{value: _self.apexClasses[index].created});
            } else {
                row.push({value: ''},{value: ''},{value: ''},{value: ''},{value: ''});
            }

            row.push({value: ''},{value: ''});

            if (index < _self.apexTriggers.length) {
                row.push({value: _self.apexTriggers[index].Name}, {value: _self.apexTriggers[index].linesCovered});
                if (_self.apexTriggers[index].pctColor === 'slds-text-color_success') {
                    row.push({value: parseInt(_self.apexTriggers[index].pctCovered, 10), type: Number, format: '##0\\%'})
                } else {
                    row.push({value: parseInt(_self.apexTriggers[index].pctCovered, 10), color: '#9A2826', backgroundColor: '#F6C9CE', type: Number, format: '##0\\%'})
                }
                row.push({value: _self.apexTriggers[index].modified},{value: _self.apexTriggers[index].created});
            }
            index++;
            data.push(row);
        }

        console.log('finished docgen');

        await writeXlsxFile(data, {
            columns,
            fileName: _self.outputFile + '.xlsx'
        })
    }



    get totalCoverage() {
        let percent = (((this.classPctCovered[0] + this.triggerPctCovered[0]) * 100) / (this.classPctCovered[0] + this.triggerPctCovered[0] + this.classPctCovered[1] + this.triggerPctCovered[1])) + '%';
        let fraction = (this.classPctCovered[0] + this.triggerPctCovered[0]) + '/' + (this.classPctCovered[0] + this.triggerPctCovered[0] + this.classPctCovered[1] + this.triggerPctCovered[1]);
        return fraction + ' - ' + percent;
    }

    get totalClassCoverage() {
        let percent = ((this.classPctCovered[0] * 100) / (this.classPctCovered[0] + this.classPctCovered[1])) + '%';
        let fraction = this.classPctCovered[0] + '/' + (this.classPctCovered[0] + this.classPctCovered[1]);
        return fraction + ' - ' + percent;
    }

    get totalTriggerCoverage() {
        let percent = ((this.triggerPctCovered[0] * 100) / (this.triggerPctCovered[0] + this.triggerPctCovered[1])) + '%';
        let fraction = this.triggerPctCovered[0] + '/' + (this.triggerPctCovered[0] + this.triggerPctCovered[1]);
        return fraction + ' - ' + percent;
    }

    get classOptions() {

        console.log('classes', this.classListviews.length);
        return this.classListviews;
    }

    get triggerOptions() {
        return this.triggerListviews;
    }

    get testRunResultOptions() {
        return this.testRunResults;
    }

    handleClassChange(event) {
        this.listviewId = event.detail.value === '' ? null : event.detail.value;
        console.log('current listview',this.listviewId);
        getClasses({listview: this.listviewId, namedCred: this.namedCred}).then((response) => {
            console.log('response',response);
            this.apexClasses = response;
            let classIds = [];
            for(let res of response){
                classIds.push(res.Id);
            }
            console.log('precoverage');
            return getTestCoverage({classOrTriggerIds: classIds, namedCred: this.namedCred});
        }).then((response) => {
            let i = 0;
            let parsedData = JSON.parse(response);
            console.log(parsedData.records);
            let tempClasses = [...this.apexClasses];
            let classLinesCovered = 0;
            let classLinesUncovered = 0;
            for(let apexClass of tempClasses){
                while(i < parsedData.records.length && (parsedData.records[i].ApexClassOrTriggerId.startsWith('01q') || parsedData.records[i].ApexClassOrTrigger.Name.toLowerCase() < apexClass.Name.toLowerCase())){
                    i++;
                }
                if(i < parsedData.records.length && parsedData.records[i].ApexClassOrTriggerId === apexClass.Id){
                    let totalLines = (parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered) === 0 ? 1 : parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered;
                    classLinesCovered += parsedData.records[i].NumLinesCovered;
                    classLinesUncovered += parsedData.records[i].NumLinesUncovered;
                    apexClass.linesCovered = parsedData.records[i].NumLinesCovered + '/' + (parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered);
                    apexClass.pctCovered = ((parsedData.records[i].NumLinesCovered * 100) / totalLines) + '%';
                    apexClass.pctColor = ((parsedData.records[i].NumLinesCovered * 100) / totalLines) >= 85 ? "slds-text-color_success":"slds-text-color_error";
                    i++;
                } else {
                    apexClass.linesCovered = 0;
                    apexClass.pctCovered = '0%';
                    apexClass.pctColor = "slds-text-color_weak";
                }
                apexClass.modified = apexClass.LastModifiedBy.Name;
                apexClass.created = apexClass.CreatedBy.Name;
            }
            this.classPctCovered[0] = classLinesCovered;
            this.classPctCovered[1] = classLinesUncovered;

            this.apexClasses = [...tempClasses];
        }).catch(error=>
        {
            console.error('check test coverage change error here', error);
        });
    }

    handleTriggerChange(event) {
        this.triggerListviewId = event.detail.value === '' ? null : event.detail.value;
        getTriggers({listview: this.triggerListviewId, namedCred: this.namedCred}).then((response) => {
            this.apexTriggers = response;
            let triggerIds = [];
            for(let res of response){
                triggerIds.push(res.Id);
            }
            return getTestCoverage({classOrTriggerIds: triggerIds, namedCred: this.namedCred});
        }).then((response) => {
            let i = 0;
            let parsedData = JSON.parse(response);
            console.log(parsedData.records);
            let tempTriggers = [...this.apexTriggers];
            let triggerLinesCovered = 0;
            let triggerLinesUncovered = 0;
            for(let apexTrigger of tempTriggers){
                while(i < parsedData.records.length && (parsedData.records[i].ApexClassOrTriggerId.startsWith('01p') || parsedData.records[i].ApexClassOrTrigger.Name.toLowerCase() < apexTrigger.Name.toLowerCase())){
                    i++;
                }
                if(i < parsedData.records.length && parsedData.records[i].ApexClassOrTriggerId === apexTrigger.Id){
                    let totalLines = (parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered) === 0 ? 1 : parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered;
                    triggerLinesCovered += parsedData.records[i].NumLinesCovered;
                    triggerLinesUncovered += parsedData.records[i].NumLinesUncovered;
                    apexTrigger.linesCovered = parsedData.records[i].NumLinesCovered + '/' + (parsedData.records[i].NumLinesCovered + parsedData.records[i].NumLinesUncovered);
                    apexTrigger.pctCovered = ((parsedData.records[i].NumLinesCovered * 100) / totalLines) + '%';
                    apexTrigger.pctColor = ((parsedData.records[i].NumLinesCovered * 100) / totalLines) >= 85 ? "slds-text-color_success":"slds-text-color_error";
                    i++;
                } else {
                    apexTrigger.linesCovered = 0;
                    apexTrigger.pctCovered = '0%';
                    apexTrigger.pctColor = "slds-text-color_weak";
                }
                apexTrigger.modified = apexTrigger.LastModifiedBy.Name;
                apexTrigger.created = apexTrigger.CreatedBy.Name;
            }
            this.triggerPctCovered[0] = triggerLinesCovered;
            this.triggerPctCovered[1] = triggerLinesUncovered;

            this.apexTriggers = [...tempTriggers];
        }).catch(error=>
        {
            console.error('check test coverage change error here', error);
        });
    }

    doClassSorting(event) {
        this.sortClassBy = event.detail.fieldName;
        this.sortClassDirection = event.detail.sortDirection;
        this.sortData(this.sortClassBy, this.sortClassDirection, 'class');
    }

    doTriggerSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection, 'trigger');
    }

    doTestSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection, 'test');
    }

    sortData(fieldname, direction, dataType) {
        try {
            let parseData;
            if (dataType === 'class'){
                parseData = JSON.parse(JSON.stringify(this.apexClasses));
            } else if (dataType === 'test'){
                parseData = JSON.parse(JSON.stringify(this.testClasses));
            } else if (dataType === 'trigger'){
                parseData = JSON.parse(JSON.stringify(this.apexTriggers));
            }
            // Return the value stored in the field
            let keyValue = (a) => {
                return a[fieldname];
            };
            // cheking reverse direction
            let isReverse = direction === 'asc' ? 1: -1;
            // sorting data
            if (fieldname === 'pctCovered'){

                parseData.sort((x, y) => {
                    x = keyValue(x) ? parseInt(keyValue(x), 10) : 0; // handling null values
                    y = keyValue(y) ? parseInt(keyValue(y), 10) : 0;
                    // sorting values based on direction
                    
                    return isReverse * ((x > y) - (y > x));
                });
            } else {
                parseData.sort((x, y) => {
                    x = keyValue(x) ? keyValue(x) : ''; // handling null values
                    y = keyValue(y) ? keyValue(y) : '';
                    // sorting values based on direction
                    return isReverse * ((x > y) - (y > x));
                });
            }
            if (dataType === 'class'){
                this.apexClasses = parseData;
            } else if (dataType === 'test'){
                this.testClasses = parseData;
            } else if (dataType === 'trigger'){
                this.apexTriggers = parseData;
            }
        } catch(error)
        {
            console.error('check test coverage change error here', error);
        } 
    }    



    handleTestRunResultChange(event) {
        this.testRunResultId = event.detail.value;
        
        
        getTestClasses({testRunResult: event.detail.value}).then(result => {
            for(let res of result){

                res.classname = res.ApexClass.Name;
                res.modified = res.ApexClass.LastModifiedBy.Name;
                res.created = res.ApexClass.CreatedBy.Name;
                res.outcomeColor = res.Outcome === 'Pass' ? "slds-text-color_success":"slds-text-color_error";
            }
            this.testClasses = result;
        });
    }

    handleCredentialInputChange(event) {
        this.namedCred = event.detail.value;
    }
    
    handleFileOutputChange(event) {
        this.outputFile = event.detail.value;
    }
}
