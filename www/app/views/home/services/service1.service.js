(function() {

    'use strict';

    angular.module('oinio.services')
        .service('Service1Service', function($q, $log, $filter,LocalDataService,SMARTSTORE_COMMON_SETTING,
                                             ConnectionMonitor,
                                             LocalSyncService,
                                             IonicLoadingService,
                                             ForceClientService) {
            //Service1Service content Start.
            let service = this;
            let hosturl = '/services/apexrest/Service1Service?';




            /**
             * replace function of HomeService.getUserObjectById
             */
            this.getUserObjectById = function (str_userId,isOnline) {
                if(isOnline){
                    let sql = "select id,Name from user where id = '" + str_userId + "' limit 50";
                    let url = service.buildURL('querySobject',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,requestMethod);
                } else {
                    let deferred = $q.defer();

                    let sql =  "select {User:_soup}\
                         from {User}\
                         where {User:Id}='"+Id+"'";
                    let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        let user;
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                user = entry[0];
                            });
                        }
                        deferred.resolve(user);
                    }, function (err) {
                        $log.error(err);
                        console.error(err);
                        deferred.reject(err);
                    });
                    //console.log('getUserObjectById::', deferred.promise);
                    return deferred.promise;
                }
            };





            /**
             * replace function of HomeService.searchAccounts
             */
            this.searchAccounts = function(keyword,isOnline){
                if(isOnline){
                    let sql = "select id,Name,Customer_Number__c,Address__c,SAP_Number__c from Account where Name like '%" + keyword +
                                "%' or Customer_Number__c like '%" + keyword + "%' limit 50";
                    let url = service.buildURL('querySobjects',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,requestMethod);
                } else {
                    let deferred = $q.defer();

                    let sql = "select {Account:_soup}\
                         from {Account}\
                         where {Account:Name} like '%" + keyword + "%'\
                             or {Account:Customer_Number__c} like '%" + keyword + "%'";
                    let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        let accounts = [];
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                accounts.push({
                                    Id: entry[0].Id,
                                    Name: entry[0].Name,
                                    Customer_Number__c: entry[0].Customer_Number__c,
                                    Address__c: entry[0].Address__c,
                                    SAP_Number__c: entry[0].SAP_Number__c,
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
                    //console.log('searchAccounts::', deferred.promise);
                    return deferred.promise;
                }
            };


            /**
             * replace function of HomeService.getLatest3ServiceOrders
             */
            this.getLatest3ServiceOrders = function(acctId,isOnline){
                if(isOnline){
                    let sql = "select Id,Name,Account_Ship_to__c,Service_Order_Type__c,Service_Order_Owner__c,Status__c,"+
                            "Plan_Date__c,Truck_Serial_Number__c,Description__c from Service_Order_Overview__c " +
                            " where Account_Ship_to__c ='" + acctId + "' order by Id desc limit 3";
                    let url = service.buildURL('querySobjects',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,requestMethod);
                } else {
                    let deferred = $q.defer();

                    let sql = "select {Service_Order_Overview__c:_soup}\
                         from {Service_Order_Overview__c}\
                         where {Service_Order_Overview__c:Account_Ship_to__c_sid} = '" + acctId + "' \
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
                    //console.log('getLatest3ServiceOrders::', deferred.promise);
                    return deferred.promise;
                }
            };


            /**
             * replace function of HomeService.getUsersObjectByName
             */
            this.getUsersObjectByName = function(str_name,isOnline) {
                if(isOnline){
                    let sql = "select Id,Name from user where Name like '%" + str_name + "%' limit 50";
                    let url = service.buildURL('querySobjects',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,requestMethod);
                } else {
                    let deferred = $q.defer();

                    let sql = "select {User:_soup}\
                         from {User}\
                         where {User:Name} like '%" + str_name + "%'";
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
                    //console.log('getUsersObjectByName::', deferred.promise);
                    return deferred.promise;
                }
            };


            /**
             * replace function of AccountService.getAccountWithDetails
             */
            this.getAccountWithDetails = function(accountId,isOnline){
                if(isOnline){
                    return service.getAccountObjectById(accountId,true);
                } else {
                    let deferred = $q.defer();
                    service.getAccountObjectById(accountId,false).then(function (account) {
                        account['Sale_Group_Code__r'] = service.getBTUObjectById(account.Sale_Group_Code__c,false);
                        deferred.resolve(account);
                    }).catch(function (err) {
                        $log.error(err);
                        console.error(err);
                        deferred.reject(err);
                    });
                    //console.log('getAccountWithDetails::', deferred.promise);
                    return deferred.promise;
                }
            };


            /**
             * replace function of AccountService.getAccount
             */
            this.getAccountObjectById = function(accountId,isOnline) {
                if(isOnline){
                    let sql = "select Id,Name,SAP_Number__c,Address__c,Salesman__c,Salesman_formula__c," +
                        "Sale_Group_Code__c,Customer_Number__c,Office_Address__c,Office_Location__longitude__s,Office_Location__latitude__s" +
                        "Sale_Group_Code__r.Id,Sale_Group_Code__r.Name" +
                        " from Account where Id = '" + accountId + "' limit 50";
                    let url = service.buildURL('querySobject',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,requestMethod);
                } else {
                    let deferred = $q.defer();

                    let sql = "select {Account:_soup}\
                         from {Account}\
                         where {Account:Id}='" + accountId + "'";
                    let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        let account;
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                account = {
                                    Id: entry[0].Id,
                                    Name: entry[0].Name,
                                    SAP_Number__c: entry[0].SAP_Number__c,
                                    Address__c: entry[0].Address__c,
                                    Salesman__c: entry[0].Salesman__c,
                                    Salesman_formula__c: entry[0].Salesman_formula__c,
                                    Sale_Group_Code__c: entry[0].Sale_Group_Code__c,
                                    Customer_Number__c: entry[0].Customer_Number__c,
                                    Office_Address__c: entry[0].Office_Address__c,
                                    Office_Location__longitude__s: entry[0].Office_Location__longitude__s,
                                    Office_Location__latitude__s: entry[0].Office_Location__latitude__s,
                                    _soupEntryId: entry[0]._soupEntryId
                                };
                            });
                        }
                        deferred.resolve(account);
                    }, function (err) {
                        $log.error(err);
                        console.error(err);
                        deferred.reject(err);
                    });
                    //console.log('getAccount::', deferred.promise);
                    return deferred.promise;
                }
            };


            /**
             * replace function of AccountService.getBTU
             */
            this.getBTUObjectById = function(btuId,isOnline) {
                if(isOnline){
                    let sql = "select Id,Name from BTU__c where Id = '" + btuId + "' limit 50";
                    let url = service.buildURL('querySobject',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,requestMethod);
                } else {
                    let deferred = $q.defer();

                    let sql = "select {BTU__c:_soup}\
                         from {BTU__c}\
                         where {BTU__c:Id}='" + btuId + "'";
                    let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        let BTU;
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                BTU = {
                                    Id: entry[0].Id,
                                    Name: entry[0].Name,
                                    _soupEntryId: entry[0]._soupEntryId
                                };
                            });
                        }
                        deferred.resolve(BTU);
                    }, function (err) {
                        $log.error(err);
                        console.error(err);
                        deferred.reject(err);
                    });
                    //console.log('getBTU::', deferred.promise);
                    return deferred.promise;
                }
            };



            //Util Methods Start.
            this.buildURL = function (str_type,str_param) {
                return 'type=' + str_type + '&param=' + str_param;
            };

            this.sendRest = function (url,requestMethod) {
                var deferred = $q.defer();
                console.log('Service1Service::sendRest::param::',hosturl + url);
                ForceClientService.getForceClient().apexrest(hosturl + url, requestMethod, {}, null, function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    console.log('Service1Service::sendRest::error::',error);
                    deferred.reject('sendRest::error::'+error);
                });

                return deferred.promise;
            };

        //Service1Service content End.
        });
})();





























