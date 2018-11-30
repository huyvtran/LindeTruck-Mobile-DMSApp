/**
 * Module oinio.services HomeService
 */
angular.module('oinio.services', [])
    .service('HomeService', function HomeService($q, $filter, $log, LocalDataService, ConnectionMonitor, IonicLoadingService, LocalSyncService,ForceClientService, SMARTSTORE_COMMON_SETTING){
        let service = this;

        /*
        this.searchUnplannedOrders = function(){
            console.log('searchUnplannedOrders.keyword:%s');
            let deferred = $q.defer();

            let sql =  "select {Service_Order_Overview__c:_soup}\
                         from {Service_Order_Overview__c}\
                         where {Service_Order_Overview__c:Status__c} != '' and {Service_Order_Overview__c:Account_Ship_to__c} != '' and {Service_Order_Overview__c:Account_Ship_to__c_sid} != '' ";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let result = new Object();
                let orders = [];
                let accIds = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        let accId = entry[0].Account_Ship_to__c;
                        orders.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Account_Ship_to__c: accId,
                            Service_Order_Type__c: entry[0].Service_Order_Type__c,
                            Service_Order_Owner__c: entry[0].Service_Order_Owner__c,
                            Status__c: entry[0].Status__c,
                            Plan_Date__c: entry[0].Plan_Date__c,
                            Truck_Serial_Number__c: entry[0].Truck_Serial_Number__c,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                        if (accIds.indexOf(accId) == -1) {
                            accIds.push(accId);
                        }
                    });
                    result.orders = orders;
                    result.accIds = accIds;
                }
                deferred.resolve(result);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('searchUnplannedOrders::', deferred.promise);
            return deferred.promise;
        };
        */

        this.searchUnplannedOrders = function(){
            let deferred = $q.defer();
            let result = new Object();

            ForceClientService.getForceClient()
                .apexrest(
                    '/HomeService',
                    'GET',
                    {

                    },null,function success(res) {
                        console.log(res);
                        result =  res;
                        deferred.resolve(result);
                    },
                    function error(msg) {
                        console.log(msg);
                        deferred.reject(msg);
                    });

            return deferred.promise;
        };


        this.getAccountForAccIds = function(Ids) {
            console.log('getAccountForAccIds.Ids:%s', Ids);
            let deferred = $q.defer();

            if(Ids == null || Ids.accIds == null || Ids.orders == null || Ids.accIds.length < 1|| Ids.orders.length < 1){
                console.log('getAccountForAccIds::NULL');
                deferred.resolve(null);
                return deferred.promise;
            }

            let sqlInString = "'"+Ids.accIds.join("','")+"'";

            let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Id} in (" +sqlInString+ ")";
            console.log('getAccountForAccIds::sal::',sql);

            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let account;
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        angular.forEach(Ids.orders, function (order) {
                            if(order.Account_Ship_to__c == entry[0].Id){
                                account = {
                                    Id: entry[0].Id,
                                    Name: entry[0].Name,
                                    Customer_Number__c: entry[0].Customer_Number__c,
                                    _soupEntryId: entry[0]._soupEntryId
                                };
                                order.Account_Ship_to__r = account;
                            }
                        });
                    });
                }
                deferred.resolve(Ids.orders);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getAccountForAccIds::', deferred.promise);
            return deferred.promise;
        };


        this.getOrdersList = function() {
            let deferred = $q.defer();
            let ret;
            console.log('getOrdersList::');
            service.searchUnplannedOrders().then(function (res){
                ret = res;
                return service.getAccountForAccIds(res);
            }).then(function (orders) {
                ret = orders;
                deferred.resolve(ret);
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };


        this.getBTUwithUsers = function(){
            console.log('getBTUwithUsers.Id:%s');
            let deferred = $q.defer();

            let sql =  "select {BTU__c:_soup}\
                         from {BTU__c} ";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let result = new Object();
                let BTU = [];
                let userIds = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        if(entry[0].Manager__c != null && entry[0].Manager__c != '') {
                            BTU.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                Manager__c: entry[0].Manager__c,
                                Team_Leader__c: entry[0].Team_Leader__c
                            });
                            if (userIds.indexOf(entry[0].Manager__c) == -1) {
                                userIds.push(entry[0].Manager__c);
                            }
                        }
                    });
                    result.BTU = BTU;
                    result.userIds = userIds;
                }
                deferred.resolve(result);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getBTU::', deferred.promise);
            return deferred.promise;
        };


        this.getUsersFromBTU = function(Ids) {
            console.log('getUsersFromBTU.Ids:%s', Ids);
            let deferred = $q.defer();

            if(Ids == null || Ids.userIds == null || Ids.userIds.length < 1){
                console.log('getUsersFromBTU::NULL');
                deferred.resolve(null);
                return deferred.promise;
            }

            //let sqlInString = "'"+Ids.userIds.join("','")+"'";

            let sql =  "select {User:_soup}\
                         from {User} ";
            console.log('getUsersFromBTU::sal::',sql);

            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let user;
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        angular.forEach(Ids.BTU, function (btu) {
                            if(btu.Manager__c == entry[0].Id){
                                user = {
                                    Id: entry[0].Id,
                                    Name: entry[0].Name,
                                    _soupEntryId: entry[0]._soupEntryId
                                };
                                btu.Manager__r = user;
                            }
                        });
                    });
                }
                deferred.resolve(Ids.BTU);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getUsersFromBTU::', deferred.promise);
            return deferred.promise;
        };



        this.checkBTU = function(Ids,orders) {
            console.log('checkBTU.Ids:%s', Ids);
            let deferred = $q.defer();
            try {
                let results = [];


                if(Ids == null || Ids.length < 1){
                    console.log('checkBTU::NULL');
                    deferred.resolve(null);
                    return deferred.promise;
                }

                let userIds = [];
                angular.forEach(Ids, function (btu) {
                    if(btu.Manager__c != null){
                        let each = new Object();
                        each.userId = btu.Manager__c;
                        each.userName = btu.Manager__r == null? null : btu.Manager__r.Name;
                        each.userSoupEntryId = btu.Manager__r == null? null : btu.Manager__r._soupEntryId;
                        each.manageUserIds = [];
                        each.manageUserIds.push(btu.Manager__c);
                        each.orders = [];
                        if(userIds.indexOf(each.userId) == -1){
                            userIds.push(each.userId);
                            results.push(each);
                        }
                    }
                });

                //get user's own service order
                angular.forEach(orders, function (order) {
                    angular.forEach(results, function (result) {
                        if(order.Service_Order_Owner__c == result.userId){
                            result.orders.push(order);
                        }
                    });
                });

                //get user's children service order
                var map_btuName_childUsers = new Map();
                var map_btuName_managerUser = new Map();

                angular.forEach(Ids, function (btu) {
                    if(btu.Name != null && btu.Manager__c != null && btu.Team_Leader__c == false){
                        if(map_btuName_childUsers.get(btu.Name) == null){
                            map_btuName_childUsers.set(btu.Name,[]);
                        }
                        map_btuName_childUsers.get(btu.Name).push(btu.Manager__c);
                    }
                    if(btu.Name != null && btu.Manager__c != null && btu.Team_Leader__c == true){
                        if(map_btuName_managerUser.get(btu.Name) == null){
                            map_btuName_managerUser.set(btu.Name,btu.Manager__c);
                        }
                    }
                });


                var map_btuName_childOrders = new Map();
                map_btuName_childUsers.forEach(function (citem, ckey) {
                    angular.forEach(citem, function (cit) {
                        angular.forEach(orders, function (order) {
                            if(order.Service_Order_Owner__c == cit){
                                if(map_btuName_childOrders.get(ckey) == null){
                                    map_btuName_childOrders.set(ckey,[]);
                                }
                                map_btuName_childOrders.get(ckey).push(order);
                            }
                        });
                    });
                });

                var map_managerId_childOrders = new Map();
                map_btuName_managerUser.forEach(function (item, key) {
                    map_btuName_childOrders.forEach(function (oitems, bkey) {
                        if(bkey == key){
                            map_managerId_childOrders.set(item,oitems);
                        }
                    });
                });

                map_managerId_childOrders.forEach(function (oitems, uId) {
                    angular.forEach(results, function (result) {
                        if(uId == result.userId){
                            result.orders = result.orders.concat(oitems);
                        }
                    });
                });


                deferred.resolve(results);
            } catch (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            }
            console.log('checkBTU::', deferred.promise);
            return deferred.promise;
        };



        this.getEachOrder = function() {
            let deferred = $q.defer();
            let ret;
            let bts;
            let orders;
            console.log('getEachOrder::');
            service.getBTUwithUsers().then(function (res){
                ret = res;
                console.log('Step1::',res);
                return service.getUsersFromBTU(res);
            }).then(function (btus) {
                console.log('Step2::',btus);
                bts = btus;
                return service.getOrdersList();
            }).then(function (os) {
                console.log('Step3::',os);
                orders = os;
                return service.checkBTU(bts,orders);
            }).then(function (res) {
                console.log('Step4::',res);
                ret = res;
                deferred.resolve(ret);
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };

        /**
         * @func  save new service order overview
         * @desc  save Service_Order_Overview__c with recordType Work_Order to Salesforce
         * @param {Service_Order_Overview__c[]} adrs - the data which should be create and save objects for,
         *      the data should contain 
         *  Service_Order_Overview__c.Service_Order_Owner__c,
         *  Service_Order_Overview__c.Service_Order_Owner__r._soupEntryId  // wai
         * 
         *  Service_Order_Overview__c.Plan_Date__c,
         *
         *  Service_Order_Overview__c.Description__c,
         *
         *  Service_Order_Overview__c.Account_Ship_to__c,           //order
         *  Service_Order_Overview__c.Account_Ship_to__c._soupEntryId,
         *
         *  Service_Order_Overview__c.Service_Order_Type__c            //unnecessary,default value 'work order'
         *
         *  {Truck_Fleet__c[]} trucks - the truck data which should be saved in each child service order
         *  //unnecessary param
         *
         *  Service_Order__c.Truck_Serial_Number__c,
         *  Service_Order__c.Truck_Serial_Number__r._soupEntryId,    //truck
         * 
         * @returns {Promise} an array of Service_Order__c objects containing like
         *   "_soupId": 1234567890,
         */
        this.addServiceOrders = function (adrs,trucks) {
            console.log('saveServiceOrders:: ', adrs);
            var deferred = $q.defer();

            let str_recTypeDevName = '';

            if(adrs != null && adrs[0] != null && adrs[0].Service_Order_Type__c != null && adrs[0].Service_Order_Type__c != '') {
                if (adrs[0].Service_Order_Type__c == 'Work Order') {
                    str_recTypeDevName = 'Work_Order';
                } else if (adrs[0].Service_Order_Type__c == 'Customer Consult') {
                    str_recTypeDevName = 'Customer_Inquiry';
                } else if (adrs[0].Service_Order_Type__c == 'Customer Complaint') {
                    str_recTypeDevName = 'Customer_Complaint';
                }
            }

            LocalDataService.createSObject('Service_Order_Overview__c',str_recTypeDevName).then(function(sobject) {
                var newItem, adr;
                var adrsToSave = [];
                var isError = false;
                console.log('newItem::sobject:soo:',sobject);
                for (var i=0;i<adrs.length;i++){
                    adr = adrs[i];
                    newItem = service.cloneObj(sobject);

                    newItem['Service_Order_Owner__c'] = adr.Service_Order_Owner__c;
                    newItem['Service_Order_Owner__c_sid'] = adr.Service_Order_Owner__r._soupEntryId;
                    newItem['Service_Order_Owner__c_type'] = 'User';

                    newItem['Account_Ship_to__c'] = adr.Account_Ship_to__c;
                    newItem['Account_Ship_to__c_sid'] = adr.Account_Ship_to__r._soupEntryId;
                    if( (adr.Account_Ship_to__c == '' || adr.Account_Ship_to__c == null) && (adr.Account_Ship_to__r._soupEntryId == '' || adr.Account_Ship_to__r._soupEntryId == null) ){
                        var isError = true;
                        continue;
                    }
                    newItem['Account_Ship_to__c_type'] = 'Account';

                    newItem['Service_Order_Type__c'] = 'Work Order';
                    if(adr.Service_Order_Type__c != null && adr.Service_Order_Type__c != ''){newItem['Service_Order_Type__c'] = adr.Service_Order_Type__c;}

                    newItem['Priority__c'] = 'Medium';
                    if(adr.Priority__c != null && adr.Priority__c != ''){newItem['Priority__c'] = adr.Priority__c;}

                    newItem['Plan_Date__c'] = adr.Plan_Date__c;
                    newItem['Description__c'] = adr.Description__c;
                    newItem['Status__c'] = 'Not Planned';

                    adrsToSave.push(newItem);
                    console.log('newItem::',newItem);
                }

                console.log('current error status:', isError);

                if(isError){
                    deferred.reject('Customer Name is empty!.');
                    return deferred.promise;
                }
                LocalDataService.saveSObjects('Service_Order_Overview__c', adrsToSave).then(function(result) {
                    console.log('addServiceOrders1:::',result);
                    if (!result){
                        //console.error("!result");
                        deferred.reject('Failed to get result.');
                        return;
                    }
                    for (var i=0;i<result.length;i++){
                        if (result[i].success){
                            adrs[i]._soupEntryId = result[i]._soupEntryId;
                        }
                    }
                    console.log('addServiceOrders2:::',adrs);
                    deferred.resolve(adrs);
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



        this.addChildServiceOrders = function (adrs,trucks) {
            $log.debug('addChildServiceOrders:: '+ adrs);
            var deferred = $q.defer();

            let str_recTypeDevName = '';

            if(adrs != null && adrs[0] != null && adrs[0].Service_Order_Type__c != null && adrs[0].Service_Order_Type__c != '') {
                if (adrs[0].Service_Order_Type__c == 'Work Order') {
                    str_recTypeDevName = 'Work_Order';
                } else if (adrs[0].Service_Order_Type__c == 'Customer Consult') {
                    str_recTypeDevName = 'Customer_Inquiry';
                } else if (adrs[0].Service_Order_Type__c == 'Customer Complaint') {
                    str_recTypeDevName = 'Customer_Complaint';
                }
            }

            LocalDataService.createSObject('Service_Order__c',str_recTypeDevName).then(function(sobject) {
                var newItem;
                var adr = adrs[0];
                var adrsToSave = [];
                console.log('newItem::sobject:so:',sobject);

                for (var i=0;i<trucks.length;i++){
                    newItem = service.cloneObj(sobject);

                    newItem['Service_Order_Owner__c'] = adr.Service_Order_Owner__c;
                    newItem['Service_Order_Owner__c_sid'] = adr.Service_Order_Owner__r._soupEntryId;
                    newItem['Service_Order_Owner__c_type'] = 'User';

                    newItem['Account_Name_Ship_to__c'] = adr.Account_Ship_to__c;
                    newItem['Account_Name_Ship_to__c_sid'] = adr.Account_Ship_to__r._soupEntryId;
                    newItem['Account_Name_Ship_to__c_type'] = 'Account';

                    newItem['Service_Order_Overview__c_sid'] = adr._soupEntryId;
                    newItem['Service_Order_Overview__c_type'] = 'Service_Order_Overview__c';

                    newItem['Service_Order_Type__c'] = 'Work Order';
                    if(adr.Service_Order_Type__c != null && adr.Service_Order_Type__c != ''){newItem['Service_Order_Type__c'] = adr.Service_Order_Type__c;}

                    newItem['Priority__c'] = 'Medium';
                    if(adr.Priority__c != null && adr.Priority__c != ''){newItem['Priority__c'] = adr.Priority__c;}

                    //if(adrRecordType != null && adrRecordType.Id != null){newItem['RecordTypeId'] = adrRecordType.Id;}

                    newItem['Plan_Date__c'] = adr.Plan_Date__c;
                    newItem['Description__c'] = adr.Description__c;
                    newItem['Status__c'] = 'Not Planned';

                    if(trucks[i].Id != null && trucks[i].Id !=''){
                        newItem['Truck_Serial_Number__c'] = trucks[i].Id;
                        newItem['Truck_Serial_Number__c_sid'] = trucks[i]._soupEntryId;
                        newItem['Truck_Serial_Number__c_type'] = 'Truck_Fleet__c';
                    }

                    adrsToSave.push(newItem);
                    console.log('newItem::',newItem);
                }
                LocalDataService.saveSObjects('Service_Order__c', adrsToSave).then(function(result) {
                    console.log('addChildServiceOrders1:::',result);
                    if (!result){
                        //console.error("!result");
                        deferred.reject('Failed to get result.');
                        return;
                    }
                    for (var i=0;i<result.length;i++){
                        if (result[i].success){
                            adrsToSave[i]._soupEntryId = result[i]._soupEntryId;
                        }

                    }
                    console.log('addChildServiceOrders2:::',adrsToSave);
                    deferred.resolve(adrsToSave);
                    service.synchronize().then(function () {
                        deferred.resolve('done');
                    });
                }, function (error) {
                    // log error
                    console.log(error);
                });

            }, angular.noop);

            return deferred.promise;
        };


        this.addWorkOrder = function(adrs,trucks) {
            let deferred = $q.defer();
            let ret;
            console.log('addWorkOrder::');
            service.addServiceOrders(adrs,trucks).then(function (res){
                ret = res;
                return service.addChildServiceOrders(res,trucks);
            }).then(function (corders) {
                //ret = corders;
                deferred.resolve(ret);
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };


        /**
         * @func  modify service order overview
         *
         * @param {order} order - the data which should be create and save objects for,
         *      the data should contain
         *  Service_Order_Overview__c._soupEntryId,
         *
         *  {user} user - who should do the service order，the data should contain
         *  user.Id
         *  user._soupEntryId
         *
         *  {date} day - which day should applied
         *
         * @returns {Promise} an array of Service_Order__c objects containing like
         *   "_soupId": 1234567890,
         */
        this.modifyWorkOrder = function(order,user,day){
            let deferred = $q.defer();
            let ret;


            LocalDataService.getSObject('Service_Order_Overview__c',order._soupEntryId).then(function(sobject) {
                sobject['Service_Order_Owner__c'] = user.Id;
                sobject['Service_Order_Owner__c_sid'] = user._soupEntryId;
                sobject['Service_Order_Owner__c_type'] = 'User';
                sobject['Plan_Date__c'] = day;
                if(sobject['Status__c'] == null || sobject['Status__c'] == '' || sobject['Status__c'] == 'Not Planned'){
                    sobject['Status__c'] = 'Not Started';
                }
                ret = sobject;
                console.log('modifyWorkOrder::'+order._soupEntryId+'::',sobject);
                return LocalDataService.updateSObjects('Service_Order_Overview__c', [sobject]);
            }).then(function(sorderoverview) {
                console.log('modifyWorkOrder::11',sorderoverview);
                ret = sorderoverview;
                return service.modifyChildWorkOrder(order._soupEntryId,user,day);
            }).then(function (corders) {
                ret = corders;
                deferred.resolve(ret);
            }).catch(function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };


        this.searchChildOrderForParent = function(sid){
            console.log('searchChildOrderForParent.keyword:%s');
            let deferred = $q.defer();

            let sql =  "select {Service_Order__c:_soup}\
                         from {Service_Order__c}\
                         where {Service_Order__c:Service_Order_Overview__c_sid} ='"+sid+"'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let orders = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        let accId = entry[0].Account_Ship_to__c;
                        orders.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Account_Ship_to__c: accId,
                            Service_Order_Overview__c: entry[0].Service_Order_Overview__c,
                            Service_Order_Type__c: entry[0].Service_Order_Type__c,
                            Service_Order_Owner__c: entry[0].Service_Order_Owner__c,
                            Status__c: entry[0].Status__c,
                            Plan_Date__c: entry[0].Plan_Date__c,
                            Truck_Serial_Number__c: entry[0].Truck_Serial_Number__c,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                    });
                }
                deferred.resolve(orders);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('searchChildOrderForParent::', deferred.promise);
            return deferred.promise;
        };



        this.modifyChildWorkOrder = function(parentsid,user,day){
            let deferred = $q.defer();
            let res = [];
            service.searchChildOrderForParent(parentsid).then(function(orders){
                angular.forEach(orders, function (order) {
                    order['Service_Order_Owner__c'] = user.Id;
                    order['Service_Order_Owner__c_sid'] = user._soupEntryId;
                    order['Service_Order_Owner__c_type'] = 'User';
                    if(order['Status__c'] == null || order['Status__c'] == '' || order['Status__c'] == 'Not Planned'){
                        order['Status__c'] = 'Not Started';
                    }
                    order['Plan_Date__c'] = day;
                    res.push(order);
                });
                return service.saveServiceOrders(res);
            }).then(function (corders) {
                ret = corders;
                deferred.resolve(ret);
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };


        /**
         * @func  saveServiceOrder
         * @desc  update a Service_Order__c object
         * @param object
         * @returns {Promise}
         */
        this.saveServiceOrder = function(od) {
            var _this = this;
            var deferred = $q.defer();

            LocalDataService.updateSObjects('Service_Order__c', [od]).then(function(success) {

                // _this.synchronize().then(function() {
                deferred.resolve();
                // }, function(err) {
                //     deferred.reject(err);
                // });

            }, function(error) {
                $log.error('>>>> error while saving ServiceOrder', error);

                deferred.reject(error);
            });

            return deferred.promise;
        };


        /**
         * @func  saveServiceOrders
         * @desc  update an array of Service_Order__c
         * @param object[]
         * @returns {Promise}
         */
        this.saveServiceOrders = function(ods) {
            var _this = this;
            var deferred = $q.defer();

            LocalDataService.updateSObjects('Service_Order__c', ods).then(function(success) {

                // _this.synchronize().then(function() {
                //deferred.resolve();
                // }, function(err) {
                //     deferred.reject(err);
                // });

                service.synchronize().then(function () {
                    deferred.resolve('done');
                });

            }, function(error) {
                $log.error('>>>> error while saving ServiceOrders', error);

                deferred.reject(error);
            });

            return deferred.promise;
        };



        /**
         * @func  getAccountObjectBySid
         * @desc  get Account with all fields by _soupEntryId
         * @param _soupEntryId(String)
         * @returns {Promise} an array of Account objects containing like
         *   "_soupEntryId": 1234567890,
         */
        this.getAccountObjectBySid = function(sid) {
            var deferred = $q.defer();
            LocalDataService.getSObject('Account', sid).then(function(res) {
                deferred.resolve(res);
            }, function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };


        /**
         * @func  getAccountObjectById
         * @desc  get Account with all fields by ID
         * @param id(String)
         * @returns {Promise} an array of Account objects containing like
         *   "_soupEntryId": 1234567890,
         */
        this.getAccountObjectById = function(Id) {
            console.log('getAccountObjectById.Id:%s', Id);
            let deferred = $q.defer();

            let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Id}='"+Id+"'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let user;
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        user = {
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            _soupEntryId: entry[0]._soupEntryId
                        };
                    });
                }
                deferred.resolve(user);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getAccountObjectById::', deferred.promise);
            return deferred.promise;
        };


        /**
         * @func  getAccountObjectByName
         * @desc  get Account with all fields by name
         * @param name(String)
         * @returns {Promise} an array of Account objects containing like
         *   "_soupEntryId": 1234567890,
         */
        this.getAccountObjectByName = function(str_name) {
            console.log('getAccountObjectByName.Name:%s', str_name);
            let deferred = $q.defer();

            let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Name} like '%"+str_name+"%' limit 1";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let user;
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        user = {
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            _soupEntryId: entry[0]._soupEntryId
                        };
                    });
                }
                deferred.resolve(user);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getAccountObjectByName::', deferred.promise);
            return deferred.promise;
        };


        /**
         * @func  getUserObjectBySid
         * @desc  get User with all fields by _soupEntryId
         * @param _soupEntryId(String)
         * @returns {Promise} an array of User objects containing like
         *   "_soupEntryId": 1234567890,
         */
        this.getUserObjectBySid = function(sid) {
            var deferred = $q.defer();
            LocalDataService.getSObject('User', sid).then(function(res) {
                deferred.resolve(res);
            }, function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };


        /**
         * @func  getUserObjectById
         * @desc  get User with all fields by Id
         * @param Id(String)
         * @returns {Promise} an array of User objects containing like
         *   "_soupEntryId": 1234567890,
         */
        this.getUserObjectById = function(Id) {
            console.log('getUserObjectById.Id:%s', Id);
            let deferred = $q.defer();

            let sql =  "select {User:_soup}\
                         from {User}\
                         where {User:Id}='"+Id+"'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let user;
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        user = {
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            _soupEntryId: entry[0]._soupEntryId
                        };
                    });
                }
                deferred.resolve(user);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getUserObjectById::', deferred.promise);
            return deferred.promise;
        };



        /**
         * @func  getUsersObjectByName
         * @desc  get Users with all fields by name
         * @param name(String)
         * @returns {Promise} an array of User objects containing like
         *   "_soupEntryId": 1234567890,
         */
        this.getUsersObjectByName = function(str_name) {
            console.log('getUsersObjectByName.Name:%s', str_name);
            let deferred = $q.defer();

            let sql =  "select {User:_soup}\
                         from {User}\
                         where {User:Name} like '%"+str_name+"%'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let users = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        users.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                    });
                }
                deferred.resolve(users);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getUsersObjectByName::', deferred.promise);
            return deferred.promise;
        };


        this.searchAccounts = function(keyword){
            console.log('searchAccounts.keyword:%s', keyword);
            let deferred = $q.defer();

            let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Name} like '%"+keyword+"%'\
                             or {Account:Customer_Number__c} like '%"+keyword+"%'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let accounts = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        accounts.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Customer_Number__c: entry[0].Customer_Number__c,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                    });
                }
                deferred.resolve(accounts);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('searchAccounts::', deferred.promise);
            return deferred.promise;
        };


        this.searchOrder = function(Id){
            console.log('searchOrder.keyword:%s');
            let deferred = $q.defer();

            let sql =  "select {Service_Order_Overview__c:_soup}\
                         from {Service_Order_Overview__c}\
                         where {Service_Order_Overview__c:_soupEntryId} ='"+Id+" '\
                            or {Service_Order_Overview__c:Id} = '"+Id+"'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let result = new Object();
                let orders = [];
                let accIds = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        let accId = entry[0].Account_Ship_to__c;
                        orders.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Account_Ship_to__c: accId,
                            Service_Order_Type__c: entry[0].Service_Order_Type__c,
                            Service_Order_Owner__c: entry[0].Service_Order_Owner__c,
                            Status__c: entry[0].Status__c,
                            Plan_Date__c: entry[0].Plan_Date__c,
                            Truck_Serial_Number__c: entry[0].Truck_Serial_Number__c,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                        if (accIds.indexOf(accId) == -1) {
                            accIds.push(accId);
                        }
                    });
                    result.orders = orders;
                    result.accIds = accIds;
                }
                deferred.resolve(result);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('searchOrder::', deferred.promise);
            return deferred.promise;
        };




        this.getOrder = function(Id) {
            let deferred = $q.defer();
            let ret;
            console.log('getOrder::');
            service.searchOrder(Id).then(function (res){
                ret = res;
                return service.getAccountForAccIds(res);
            }).then(function (orders) {
                ret = orders;
                deferred.resolve(ret);
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };


        this.searchTrucks = function(keyword,acctId){
            console.log('searchTrucks.keyword:%s', keyword,acctId);
            let deferred = $q.defer();

            let sql =  "select {Truck_Fleet__c:_soup}\
                         from {Truck_Fleet__c}\
                         where ({Truck_Fleet__c:Name} like '%"+keyword+"%'\
                             or {Truck_Fleet__c:Model__c} like '%"+keyword+"%')";

            if(acctId != null && acctId != ''){
                sql = sql + " and {Truck_Fleet__c:Ship_To_CS__c} ='"+ acctId +"'";
            }
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let trucks = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        trucks.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Model__c: entry[0].Model__c,
                            Ship_To_CS__c: entry[0].Ship_To_CS__c,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                    });
                }
                deferred.resolve(trucks);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('searchTrucks::', deferred.promise);
            return deferred.promise;
        };

        /**
         * online and offline search truck fleet
         * @param keyWord {String} Name, Model query
         * @param acctId {String} account salesforce id
         * @param limit {string} the number you want to query (for online, offline enter'')
         * @param isOnline {boolean} Online is true
         * @returns {*}
         */
        this.searchTruckFleets = function(keyWord, acctId, limit, isOnline){
            let deferred = $q.defer();
            let result = new Object();
            if(isOnline){
                let requestUrl = '/TruckFleetService?';
                let firstIndex = true;
                let andSign = '';

                if(keyWord != null && keyWord != ''){
                    requestUrl += 'keyword=' + keyWord;
                    firstIndex = false;
                }

                if(acctId != null && acctId != ''){
                    if(!firstIndex){
                        andSign = '&';
                    }
                    requestUrl += andSign + 'acctId=' + acctId;
                    firstIndex = false;
                }

                if((keyWord == null || keyWord == '') && (acctId == null || acctId == '')){
                    deferred.reject('keyWord and acctId can not all are null!');
                }

                if(limit != null && limit != ''){
                    requestUrl += '&limit=' + limit;
                }

                console.log('current url:::', requestUrl);

                ForceClientService.getForceClient()
                    .apexrest(
                        requestUrl,
                        'GET',
                        {

                        },null,function success(res) {
                            console.log(res);
                            result =  res;
                            deferred.resolve(result);
                        },
                        function error(msg) {
                            console.log(msg);
                            deferred.reject(msg);
                        });
            }else{
                let res;
                if(keyWord == null || keyWord == ''){
                    res = this.init20AcctTrucks(acctId);
                }else{
                    res = this.searchTrucks(keyWord,acctId);
                }

                deferred.resolve(res);
            }

            return deferred.promise;
        };

        this.init20AcctTrucks = function(acctId){
            console.log('initTrucks.keyword:%s',acctId);
            let deferred = $q.defer();

            let sql =  "select {Truck_Fleet__c:_soup}\
                         from {Truck_Fleet__c}\
                         where {Truck_Fleet__c:Ship_To_CS__c} ='"+ acctId +"' limit 20";


            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let trucks = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        trucks.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Model__c: entry[0].Model__c,
                            Ship_To_CS__c: entry[0].Ship_To_CS__c,
                            Truck_Type__c: entry[0].Truck_Type__c,
                            Warranty_End_Date__c: entry[0].Warranty_End_Date__c,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                    });
                }
                deferred.resolve(trucks);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('initTrucks::', deferred.promise);
            return deferred.promise;
        };




        this.getTruckObjectById = function(Id) {
            console.log('getTruckObjectById.Id:%s', Id);
            let deferred = $q.defer();

            let sql =  "select {Truck_Fleet__c:_soup}\
                         from {Truck_Fleet__c}\
                         where {Truck_Fleet__c:Id}='"+Id+"'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let truck;
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        truck = {
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Model__c: entry[0].Model__c,
                            Ship_To_CS__c: entry[0].Ship_To_CS__c,
                            _soupEntryId: entry[0]._soupEntryId
                        };
                    });
                }
                deferred.resolve(truck);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getTruckObjectById::', deferred.promise);
            return deferred.promise;
        };



        this.getLatest3ServiceOrders = function(acctSid){
            console.log('getLatest3ServiceOrders.keyword:%s',acctSid);
            let deferred = $q.defer();

            let sql =  "select {Service_Order_Overview__c:_soup}\
                         from {Service_Order_Overview__c}\
                         where {Service_Order_Overview__c:Account_Ship_to__c_sid} = '"+acctSid+"' \
                         order by {Service_Order_Overview__c:_soupEntryId} desc limit 3";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let orders = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        let accId = entry[0].Account_Ship_to__c;
                        orders.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Account_Ship_to__c: accId,
                            Service_Order_Type__c: entry[0].Service_Order_Type__c,
                            Service_Order_Owner__c: entry[0].Service_Order_Owner__c,
                            Status__c: entry[0].Status__c,
                            Plan_Date__c: entry[0].Plan_Date__c,
                            Truck_Serial_Number__c: entry[0].Truck_Serial_Number__c,
                            Description__c: entry[0].Description__c,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                    });
                }
                deferred.resolve(orders);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getLatest3ServiceOrders::', deferred.promise);
            return deferred.promise;
        };



        this.getTrucksForParentOrder = function(sid){
            console.log('getTrucksForParentOrder.keyword:%s'+sid);
            let deferred = $q.defer();

            let sql =  "select {Service_Order__c:_soup}\
                         from {Service_Order__c}\
                         where {Service_Order__c:Service_Order_Overview__c_sid}='"+sid+"'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let trucksids = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        trucksids.push(entry[0].Truck_Serial_Number__c_sid);
                    });
                }
                deferred.resolve(trucksids);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getTrucksForParentOrder::', deferred.promise);
            return deferred.promise;
        };

        this.getTrucksForTruckSids = function(sids){
            console.log('getTrucksForTruckSids.keyword:%s'+sids);
            let deferred = $q.defer();

            if(sids == null || sids.length < 1){
                console.log('getTrucksForTruckSids::NULL');
                deferred.resolve(null);
                return deferred.promise;
            }

            let sqlInString = "'"+sids.join("','")+"'";

            let sql =  "select {Truck_Fleet__c:_soup}\
                         from {Truck_Fleet__c}\
                         where {Truck_Fleet__c:_soupEntryId} in (" +sqlInString+ ")";

            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let trucks = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        trucks.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Model__c: entry[0].Model__c,
                            Ship_To_CS__c: entry[0].Ship_To_CS__c,
                            _soupEntryId: entry[0]._soupEntryId
                        });
                    });
                }
                deferred.resolve(trucks);
            }, function (err) {
                $log.error(err);
                console.error(err);
                deferred.reject(err);
            });
            console.log('getTrucksForTruckSids::', deferred.promise);
            return deferred.promise;
        };


        this.getTrucksForParentOrderSid = function(sId) {
            let deferred = $q.defer();
            let ret;
            console.log('getTrucksForParentOrderSid::');
            service.getTrucksForParentOrder(sId).then(function (res){
                ret = res;
                return service.getTrucksForTruckSids(res);
            }).then(function (trucks) {
                ret = trucks;
                deferred.resolve(ret);
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };


        /**
         * synchronize to salesforce if device is online
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


        /**
         * Deep clone for js object
         */
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
