(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:SCarService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('SCarService', function($q, $filter, LocalDataService, ConnectionMonitor, IonicLoadingService, LocalSyncService) {

            let service = this;

            this.serviceCarSaveButton = function (serviceCar, image1, image2) {
                let deferred = $q.defer();
                let ret;

                service.saveServiceCar(serviceCar).then(function (scSids) {
                    ret = scSids;
                    return service.saveChidServiceCarAtt1(scSids, image1, 'DriveMileage');
                }).then(function (scaSids1) {
                    return service.saveAttachments(image1,scaSids1);
                }).then(function (attRes) {
                    return service.saveChidServiceCarAtt1(ret, image2, 'SelfMileage');
                }).then(function (scaSids2) {
                    return service.saveAttachments(image2,scaSids2);
                }).then(function (res) {
                    return service.synchronize();
                }).then(function () {
                    deferred.resolve('done');
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            this.saveServiceCar = function (serviceCarItem) {
                console.log('current serviceCar:', serviceCarItem);
                var deferred = $q.defer();

                LocalDataService.createSObject('Service_Car__c').then(function(sobject) {
                    var newItem, adr;
                    var adrsToSave = [];
                    adr = serviceCarItem;
                    
                    newItem = service.cloneObj(sobject);

                    newItem['CarNo__c'] = adr.CarNo__c;//车牌号
                    newItem['GasCost__c'] = Number(adr.GasCost__c);//加油费用(Number)
                    newItem['SelfMileage__c'] = Number(adr.SelfMileage__c);// 里程表-自用(Number)
                    newItem['DriveMileage__c'] = Number(adr.DriveMileage__c);//里程表-公务(Number)
                    newItem['GasMileage__c'] = Number(adr.GasMileage__c);//里程表-加油(Number)
                    newItem['OtherCost__c'] = Number(adr.OtherCost__c);//其他费用(Number)
                    newItem['Remark__c'] = adr.Remark__c;//原因备注

                    console.log('newItem::',newItem);
                    adrsToSave.push(newItem);



                    LocalDataService.saveSObjects('Service_Car__c', adrsToSave).then(function(result) {
                        let arr_sids = [];
                        console.log('save result:::',result);
                        if (!result){
                            //console.error("!result");
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        for (var i=0;i<result.length;i++){
                            if (result[i].success){
                                //adrs[i]._soupEntryId = result[i]._soupEntryId;

                                let existFlag = false;
                                angular.forEach(arr_sids, function (s) {
                                    if(s == result[i]._soupEntryId){
                                        existFlag = true;
                                    }
                                });
                                if(!existFlag){
                                    arr_sids.push(result[i]._soupEntryId);
                                }
                            }
                        }
                        console.log('saveWorkItems3:::',arr_sids);
                        deferred.resolve(arr_sids);
                        // synchronize().then(function () {
                        //     deferred.resolve('done');
                        // });
                    }, function (error) {
                        // log error
                        console.log(error);
                    });

                }, angular.noop);

                return deferred.promise;
            };
            
            this.saveChidServiceCarAtt1 = function ( sids, images1 , type) {
                var deferred = $q.defer();

                LocalDataService.createSObject('Service_Car_Attachment__c').then(function(sobject) {
                    var newItem, adr;
                    var driveAttToSave = [];

                    //var selfAttToSave = [];
                    //adr = serviceCarItem;

                    for (var i=0;i<images1.length;i++) {
                        var currentDateTime ;
                        var myDate = new Date();
                        currentDateTime = myDate.getFullYear().toString() + (myDate.getMonth() +1).toString() + myDate.getDate().toString() +  myDate.getHours().toString() + myDate.getMinutes().toString();
                        console.log(currentDateTime);
                        newItem = service.cloneObj(sobject);
                        newItem['Name'] =  type + '-' + currentDateTime;
                        newItem['ServiceCarID__c_sid'] = sids[0];
                        driveAttToSave.push(newItem);
                    }

                    LocalDataService.saveSObjects('Service_Car_Attachment__c', driveAttToSave).then(function(result) {
                        let arr_sids = [];
                        console.log('save result:::',result);
                        if (!result){
                            //console.error("!result");
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        for (var i=0;i<result.length;i++){
                            if (result[i].success){
                                //adrs[i]._soupEntryId = result[i]._soupEntryId;

                                let existFlag = false;
                                angular.forEach(arr_sids, function (s) {
                                    if(s == result[i]._soupEntryId){
                                        existFlag = true;
                                    }
                                });
                                if(!existFlag){
                                    arr_sids.push(result[i]._soupEntryId);
                                }
                            }
                        }
                        console.log('service car att soupId:::',arr_sids);
                        deferred.resolve(arr_sids);
                        // synchronize().then(function () {
                        //     deferred.resolve('done');
                        // });
                    }, function (error) {
                        // log error
                        console.log('sc att error:::', error);
                    });

                }, angular.noop);

                return deferred.promise;
            }

            this.saveAttachments = function (images,sids) {
                let deferred = $q.defer();
                let ret;

                service.saveImages2Attachments(images,sids).then(function (array_params) {
                    console.log('saveAttachments::array_params：：',array_params);
                    return service.AddAttachments(array_params);
                }).then(function (res) {
                    console.log('saveAttachments::res：：',res);
                    deferred.resolve(res);
                }).catch(function (error) {
                    console.log('att save error:::', error );
                    deferred.reject(error);
                });

                return deferred.promise; 
            }

            this.saveImages2Attachments = function (images,sids ) {
                //console.log('saveImages2Attachments:: '+images);
                var deferred = $q.defer();
                let array_params = [];

                for (var i=0;i<images.length;i++){
                    var timestamp = new Date().getTime().toString();
                    var param = new Object();
                    param.Name = '附件-' + timestamp;
                    param.contentType = 'image/jpeg';
                    param.parentObjectType = 'Service_Car_Attachment__c';
                    param.body = dataURLtoBlob(images[i]);
                    //for (var j=0;j<sids.length;j++){
                    param.parentSoupEntryId = sids[i];
                    array_params.push(param);
                    //}
                }
                console.log('array_params：：',array_params);
                deferred.resolve(array_params);

                return deferred.promise;
            };

            this.AddAttachments = function (sids) {
                var deferred = $q.defer(),
                    results = [];

                var getNextSObject = function (index) {

                    if (index >= sids.length) {
                        deferred.resolve(results);
                    } else {
                        LocalDataService.createAttachment(sids[index]).then(function (result) {
                            results.push(result);
                            getNextSObject(++index);
                        }, function (error) {
                            console.log(error);
                            deferred.reject(error);
                        });
                    }
                };

                getNextSObject(0);

                return deferred.promise;
            };

            this.dataURLtoBlob = function (dataurl) {
                var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
            };

            this.synchronize = function () {
                var deferred = $q.defer();

                if (ConnectionMonitor.isOnline()) {
                    IonicLoadingService.show($filter('translate')('cl.sync.lb_synchronizing'));
                    LocalSyncService.syncUpObjectByAll().then(function () {
                        IonicLoadingService.hide();
                        deferred.resolve();
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            };

            this.cloneObj = function (obj) {
                var newObj = new Object();
                if(obj.RecordTypeId != null && obj.RecordTypeId != '') {
                    newObj['RecordTypeId'] = obj.RecordTypeId;
                    newObj['RecordTypeId_sid'] = obj.RecordTypeId_sid;
                    newObj['RecordTypeId_type'] = 'RecordType';
                }
                return newObj;
            };


        });
})();





























