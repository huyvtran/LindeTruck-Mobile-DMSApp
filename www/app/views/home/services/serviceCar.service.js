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
        .service('SCarService', function($q, $filter, LocalDataService, ConnectionMonitor, IonicLoadingService, LocalSyncService, FileService) {

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

            /*
            this.saveAttachments2 = function (images,sids) {
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
            */

            this.saveAttachments = function (images,sids) {
                let deferred = $q.defer();
                //let ret;
                var attArray = [];

                service.createAttachmentObj(images,sids).then(function (array_params) {
                    console.log('saveAttachments::array_params：：',array_params);
                    for (var i=0;i<images.length;i++){
                        var cashPicObj = {
                            attachment: array_params[i];
                            body: images[i];
                        };
                        attArray.push(cashPicObj);
                    }
                    console.log('att array json: ', attArray);
                    return service.commitAttachmentObj(attArray);
                }).then(function (res) {
                    console.log('saveAttachments::res：：',res);
                    deferred.resolve(res);
                }).catch(function (error) {
                    console.log('att save error:::', error );
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            this.commitAttachmentObj = function (imagesJson) {
                var deferred = $q.defer();
                deferred.resolve('success');
                return deferred.promise;
            }

            /*
            this.commitAttachmentObj2 = function (imagesJson) {
                var deferred = $q.defer();
                angular.forEach( imagesJson, function (tractorItem) {
                    AttachmentService.saveAttachment(tractorItem.attachment).then(function (result) {
                        LocalDataService.queryConfiguredObjectByName('Service_Car_Attachment__c').then(function (objectType) {
                            restoreTripAttachmentBody(result, objectType, tractorItem.body).then(function (success) {
                                console.log('save success:::', success);
                                deferred.resolve(success);
                            }, function (tractorErr) {
                                console.log('save error:::', tractorErr);
                                deferred.reject(tractorErr);
                            });
                        }, reject);
                    }, function (err) {
                        console.log('save error:::', err);
                        deferred.reject(err);
                    });
                });

                return deferred.promise;
            }
            */

            function restoreTripAttachmentBody(resAttachment, objectType, imageData) {
                var deferred = $q.defer();
                FileService.saveAttachmentBody(resAttachment, objectType, imageData).then(function (result) {
                    deferred.resolve(result);
                }, function (err) {
                    console.log(err);
                    deferred.reject(err);
                });
                return deferred.promise;
            }

            this.createAttachmentObj = function (images,sids) {
                var deferred = $q.defer();
                var array_params = [];
                LocalDataService.createSObject('Attachment').then(function (sobject) {
                    var timestamp = new Date().getTime().toString();
                    for (var i=0;i<images.length;i++){
                        var curAttachment = sobject;
                        curAttachment.Name = '附件-' + timestamp;
                        //curAttachment.Description = angular.copy(vm.description);
                        //curAttachment.ParentId = vm.trip.Id;
                        curAttachment.ParentId_sid = sids[i];
                        curAttachment.ParentId_type = 'Service_Car_Attachment__c';
                        curAttachment.ContentType = 'image/jpeg';
                        array_params.push(curAttachment);
                    }
                    //console.log('current att obj array:::', curAttachment);
                    deferred.resolve(array_params);
                }, function (dmlErr) {
                    deferred.reject(dmlErr);
                });

                return deferred.promise;
            }

            /*
            this.saveImages2Attachments = function (images,sids ) {
                //console.log('saveImages2Attachments:: '+images);
                var deferred = $q.defer();
                let array_params = [];

                for (var i=0;i<images.length;i++){
                    var timestamp = new Date().getTime().toString();
                    var param = new Object();
                    param.fileName = '附件-' + timestamp;
                    param.contentType = 'image/jpeg';
                    param.parentObjectType = 'Service_Car_Attachment__c';
                    param.body = dataURLtoBlob(images[i]);
                    //param.body = convertImgDataToBlob(images[i]);
                    //for (var j=0;j<sids.length;j++){
                    param.parentSoupEntryId = sids[i];
                    array_params.push(param);
                    //}
                }
                console.log('array_params：：',array_params);
                deferred.resolve(array_params);

                return deferred.promise;
            };
            */

            /*
            this.AddAttachments = function (sids) {
                var deferred = $q.defer(),
                    results = [];

                var getNextSObject = function (index) {

                    if (index >= sids.length) {
                        console.log('att save result:', results);
                        deferred.resolve(results);
                    } else {
                        LocalDataService.createAttachment(sids[index]).then(function (result) {
                            console.log('att save result item:', result);
                            results.push(result);
                            getNextSObject(++index);
                        }, function (error) {
                            console.log('att save error', error);
                            deferred.reject(error);
                        });
                    }
                };

                getNextSObject(0);

                return deferred.promise;
            };
            */

            //**dataURL to blob**/
            /*
            var dataURLtoBlob =  function(dataurl) {
                var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
            }
            */

            /*
            var convertImgDataToBlob = function(base64Data) {
                var format = 'image/jpeg';
                var base64 = base64Data;
                var code = window.atob(base64.split(",")[1]);
                var aBuffer = new window.ArrayBuffer(code.length);
                var uBuffer = new window.Uint8Array(aBuffer);
                for(var i = 0; i < code.length; i++){
                    uBuffer[i] = code.charCodeAt(i) & 0xff ;
                }
                console.info([aBuffer]);
                console.info(uBuffer);
                console.info(uBuffer.buffer);
                console.info(uBuffer.buffer==aBuffer); //true
                var blob=null;
                try{
                    blob = new Blob([uBuffer], {type : format});
                }
                catch(e){
                    window.BlobBuilder = window.BlobBuilder ||
                        window.WebKitBlobBuilder ||
                        window.MozBlobBuilder ||
                        window.MSBlobBuilder;
                    if(e.name == 'TypeError' && window.BlobBuilder){
                        console.log('error type!');
                        var bb = new window.BlobBuilder();
                        bb.append(uBuffer.buffer);
                        blob = bb.getBlob("image/jpeg");
                    }
                    else if(e.name == "InvalidStateError"){
                        console.log('error state error!');
                        blob = new Blob([aBuffer], {type : format});
                    }
                    else{
                    }
                }
                console.log(blob.size);
                return blob;
            };
            */
            
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





























