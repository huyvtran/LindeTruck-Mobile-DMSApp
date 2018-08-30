/**
 * Module oinio.services HomeService
 */
angular.module('oinio.services', [])
    .service('HomeService', function HomeService($q, $log, LocalDataService, SMARTSTORE_COMMON_SETTING){
        let service = this;

        this.searchUnplannedOrders = function(){
            console.log('searchUnplannedOrders.keyword:%s');
            let deferred = $q.defer();

            let sql =  "select {Service_Order__c:_soup}\
                         from {Service_Order__c}\
                         where {Service_Order__c:Status__c} != 'Not Planned'";
            let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                let result = new Object();
                let orders = [];
                let accIds = [];
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                        let accId = entry[0].Account_Name_Ship_to__c;
                        orders.push({
                            Id: entry[0].Id,
                            Name: entry[0].Name,
                            Account_Name_Ship_to__c: accId,
                            Service_Order_Type__c: entry[0].Service_Order_Type__c,
                            Service_Order_Owner__c: entry[0].Service_Order_Owner__c,
                            Status__c: entry[0].Status__c,
                            Plan_Date__c: entry[0].Plan_Date__c,
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
                            if(order.Account_Name_Ship_to__c == entry[0].Id){
                                account = {
                                    Id: entry[0].Id,
                                    Name: entry[0].Name,
                                    _soupEntryId: entry[0]._soupEntryId
                                };
                                order.Account_Name_Ship_to__r = account;
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
         * @func  save new service order
         * @desc  save Service_Order__c with recordType Work_Order to Salesforce
         * @param {Service_Order__c[]} adrs - the data which should be create and save objects for,
         *      the data should contain 
         *  Service_Order__c.Service_Order_Owner__c,
         *  Service_Order__c.Service_Order_Owner__r._soupEntryId  // wai
         * 
         * 
         *  Service_Order__c.Account_Name_Ship_to__c,           //order
         *  Service_Order__c.Plan_Date__c,
         *  Service_Order__c.Account_Name_Ship_to__r._soupEntryId,
         * 
         * @returns {Promise} an array of Service_Order__c objects containing like
         *   "_soupId": 1234567890,
         */
        this.addServiceOrders = function (adrs) {
            $log.debug('saveServiceOrders:: '+adrs);
            var deferred = $q.defer();
            console.log(service.recordTypes);
            var adrRecordType = _.find(service.recordTypes, {
                'DeveloperName': 'Work_Order'
            });
            console.log(adrRecordType);
            LocalDataService.createSObject('Service_Order__c').then(function(sobject) {
                var newItem, adr;
                var adrsToSave = [];
                for (var i=0;i<adrs.length;i++){
                    adr = adrs[i];
                    // if (!UtilsService.isUndefinedOrNull(adr.Account_Name_Ship_to__c)) {
                    newItem = _.clone(sobject);
                    newItem['Account_Name_Ship_to__c'] = adr.Account_Name_Ship_to__c;///*** */
                    newItem['Account_Name_Ship_to__c_sid'] = adr.Account_Name_Ship_to__r._soupEntryId;///*** */
                    newItem['Account_Name_Ship_to__c_type'] = 'Account';
                    newItem['Service_Order_Type__c'] = 'Work Order';
                    newItem['Service_Order_Owner__c'] = adr.Service_Order_Owner__c;///*** */
                    newItem['Service_Order_Owner__c_sid'] = adr.Service_Order_Owner__r._soupEntryId;///*** */
                    newItem['Service_Order_Owner__c_type'] = 'User';
                    newItem['RecordTypeId'] = adrRecordType.Id;
                    newItem['Plan_Date__c'] = adr.Plan_Date__c;  ///*** */
                    //newItem['Status__c'] = adr.Status__c;
                    adrsToSave.push(newItem);
                    console.log('newItem::' + newItem);
                    // }
                }
                LocalDataService.saveSObjects('Service_Order__c', adrsToSave).then(function(result) {
                    if (!result){
                        //console.error("!result");
                        deferred.reject('Failed to get result.');
                        return;
                    }
                    for (var i=0;i<result.length;i++){
                        if (result.success){
                            adrs[i]._soupEntryId = result[i]._soupEntryId;
                        }
                    }

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
                deferred.resolve();
                // }, function(err) {
                //     deferred.reject(err);
                // });

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
         * @func  getUserObjectByName
         * @desc  get User with all fields by name
         * @param name(String)
         * @returns {Promise} an array of User objects containing like
         *   "_soupEntryId": 1234567890,
         */
        this.getUserObjectByName = function(str_name) {
            console.log('getUserObjectByName.Name:%s', str_name);
            let deferred = $q.defer();

            let sql =  "select {User:_soup}\
                         from {User}\
                         where {User:Name} like '%"+str_name+"%' limit 1";
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
            console.log('getUserObjectByName::', deferred.promise);
            return deferred.promise;
        };






    });
