(function() {

    'use strict';

    angular.module('oinio.services')
        .service('Service1Service', function($q, $log, $filter,LocalDataService,SMARTSTORE_COMMON_SETTING,
                                             ConnectionMonitor,
                                             LocalSyncService,
                                             LocalCacheService,
                                             IonicLoadingService,
                                             ForceClientService) {
            //Service1Service content Start.
            let service = this;
            let hosturl = '/Service1Service?';




            /**
             * replace function of HomeService.getUserObjectById
             */
            this.getUserObjectById = function (str_userId,isOnline) {
                if(isOnline){
                    let str_fields = 'id,Name';
                    let sql = "select " +str_fields+ " from user where id = '" + str_userId + "' limit 50";
                    let url = service.buildURL('querySobject',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,sql,requestMethod,str_fields);
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
                    let str_fields = 'id,Name,Customer_Number__c,Address__c,SAP_Number__c,Office_Address__c';
                    let sql = "select " + str_fields + " " +
                                " from Account where Name like '%" + keyword +
                                "%' or Customer_Number__c like '%" + keyword + "%' " +
                                " or SAP_Number__c like '%" + keyword + "%' limit 50";
                    let url = service.buildURL('querySobjects',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,sql,requestMethod,str_fields);
                } else {
                    let deferred = $q.defer();

                    let sql = "select {Account:_soup} from {Account} " +
                                " where {Account:Name} like '%" + keyword + "%'" +
                                " or {Account:Customer_Number__c} like '%" + keyword + "%'" +
                                " or {Account:SAP_Number__c} like '%" + keyword + "%'";
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
                                    Office_Address__c: entry[0].Office_Address__c,
                                    SAP_Number__c: entry[0].SAP_Number__c,
                                    _soupEntryId: entry[0]._soupEntryId
                                });
                            });
                        }
                        deferred.resolve(accounts);
                    }, function (err) {
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
                    let str_fields = 'Id,Name,Account_Ship_to__c,Service_Order_Type__c,Service_Order_Owner__c,Status__c,'+
                                    'Plan_Date__c,Truck_Serial_Number__c,Description__c';
                    let sql = "select " + str_fields +
                            " from Service_Order_Overview__c " +
                            " where Account_Ship_to__c ='" + acctId + "' order by Id desc limit 3";
                    let url = service.buildURL('querySobjects',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,sql,requestMethod,str_fields);
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
                    let str_fields = 'id,Name';
                    let sql = "select " + str_fields +
                            " from user where Name like '%" + str_name + "%' limit 50";
                    let url = service.buildURL('querySobjects',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,sql,requestMethod,str_fields);
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
                    let str_fields = 'Id,Name,SAP_Number__c,Address__c,Salesman__c,Salesman_formula__c,' +
                                "Sale_Group_Code__c,Customer_Number__c,Office_Address__c,Office_Location__longitude__s,Office_Location__latitude__s," +
                                "Sale_Group_Code__r.Id,Sale_Group_Code__r.Name";
                    let sql = "select " + str_fields +
                        " from Account where Id = '" + accountId + "' limit 50";
                    let url = service.buildURL('querySobject',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,sql,requestMethod,str_fields);
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
                    let str_fields = 'Id,Name';
                    let sql = "select " + str_fields +
                            " from BTU__c where Id = '" + btuId + "' limit 50";
                    let url = service.buildURL('querySobject',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,sql,requestMethod,str_fields);
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
                        console.error(err);
                        deferred.reject(err);
                    });
                    //console.log('getBTU::', deferred.promise);
                    return deferred.promise;
                }
            };


            /**
             * replace function of AccountService.getContacts
             */
            this.getContactsObjectByAcctId = function(AccountId,isOnline) {
                if(isOnline){
                    let str_fields = 'Id,Name,MobilePhone,Phone,Email,Contact_State__c,Position_Type__c';
                    let sql = "select " + str_fields +
                            " from Contact where accountId ='" + AccountId + "' limit 50";
                    let url = service.buildURL('querySobjects',sql);
                    let requestMethod = 'GET';
                    return service.sendRest(url,sql,requestMethod,str_fields);
                } else {
                    let deferred = $q.defer();

                    let sql = "select {Contact:_soup}\
                         from {Contact}\
                         where {Contact:AccountId}='" + AccountId + "'";
                    let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        let contacts = [];
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                contacts.push({
                                    Id: entry[0].Id,
                                    Name: entry[0].Name,
                                    MobilePhone: entry[0].MobilePhone,
                                    Phone: entry[0].Phone,
                                    Email: entry[0].Email,
                                    Contact_State__c: entry[0].Contact_State__c,
                                    Position_Type__c: entry[0].Position_Type__c,
                                    _soupEntryId: entry[0]._soupEntryId
                                });
                            });
                        }
                        deferred.resolve(contacts);
                    }, function (err) {
                        $log.error(err);
                        console.error(err);
                        deferred.reject(err);
                    });
                    //console.log('getContacts::', deferred.promise);
                    return deferred.promise;
                }
            };

            /**
             * replace function of AccountService.updateAcctOfficeLocation
             */
            this.updateAcctOfficeLocation = function (acctId, theLongitude, theLatitude, isOnline) {
                if(isOnline){
                    let object = new Object();
                    object.attributes = { type : "Account" };
                    object.Id = acctId;
                    object.Office_Location__longitude__s = theLongitude;
                    object.Office_Location__latitude__s = theLatitude;
                    let param = JSON.stringify(object);
                    let url = service.buildJSONURL('updateSobject',param);
                    let requestMethod = 'PUT';
                    return service.sendJSONRest(url,param,requestMethod,null);
                } else {
                    var deferred = $q.defer();

                    LocalDataService.getSObject('Account',acctId).then(function(sobject) {
                        sobject['Office_Location__longitude__s'] = theLongitude;
                        sobject['Office_Location__latitude__s'] = theLatitude;

                        LocalDataService.updateSObjects('Account', [sobject]).then(function(result) {
                            if (!result){
                                deferred.reject('Failed to get result.');
                                return;
                            }
                            deferred.resolve(result);
                        }, function (error) {
                            console.log(error);
                        });

                    }, angular.noop);

                    return deferred.promise;
                }
            }

            /**
             * replace function of ContactService.addContacts
             *
             * @param {Contact[]} adrs
             *  Contact.Name,
             *  Contact.Account.Id
             *  Contact.Account._soupEntryId   (Required if isOnline == false,Not allowed if isOnline)
             *
             *  Contact.Phone,
             *  Contact.MobilePhone,
             *  Contact.Email,
             *
             *  Contact.Contact_State__c,
             *  Contact.Position_Type__c,
             *
             */
            this.saveContacts = function (contacts,isOnline) {
                if(isOnline){
                    let arr_contacts = new Array();
                    angular.forEach(contacts, function (entry) {
                        let object = new Object();
                        object.attributes = { type : "Contact" };
                        object.AccountId = entry.Account.Id;
                        object.LastName = entry.Name;
                        object.Phone = entry.Phone;
                        object.MobilePhone = entry.MobilePhone;
                        object.Email = entry.Email;
                        object.Contact_State__c = entry.Contact_State__c;
                        object.Position_Type__c = entry.Position_Type__c;
                        arr_contacts.push(object);
                    });
                    let param = JSON.stringify(arr_contacts);
                    let url = service.buildJSONURL('insertSobjects',param);
                    let requestMethod = 'POST';
                    return service.sendJSONRest(url,param,requestMethod,null);
                } else {
                    var deferred = $q.defer();
                    LocalDataService.createSObject('Contact', 'Service_Contact').then(function (sobject) {
                        var newItem, adr;
                        var adrsToSave = [];
                        for (var i = 0; i < contacts.length; i++) {
                            adr = contacts[i];
                            newItem = service.cloneObj(sobject);
                            newItem['LastName'] = adr.Name;
                            newItem['AccountId'] = adr.Account.Id;
                            newItem['AccountId_sid'] = adr.Account._soupEntryId;
                            newItem['AccountId_type'] = 'Account';
                            newItem['Phone'] = adr.Phone;
                            newItem['MobilePhone'] = adr.MobilePhone;
                            newItem['Email'] = adr.Email;
                            newItem['Contact_State__c'] = adr.Contact_State__c;
                            newItem['Position_Type__c'] = adr.Position_Type__c;
                            adrsToSave.push(newItem);
                        }
                        LocalDataService.saveSObjects('Contact', adrsToSave).then(function (result) {
                            if (!result) {
                                deferred.reject('Failed to get result.');
                                return;
                            }
                            for (var i = 0; i < result.length; i++) {
                                if (result[i].success) {
                                    contacts[i]._soupEntryId = result[i]._soupEntryId;
                                }
                            }
                            deferred.resolve(contacts);
                        }, function (error) {
                            console.log(error);
                        });

                    }, angular.noop);

                    return deferred.promise;
                }
            };

            /**
             * replace function of HomeService.getEachOrder
             */
            this.getOrdersWithGroup = function(isOnline) {
                if(isOnline){
                    let url = service.buildURL('getOrdersWithGroup','');
                    let requestMethod = 'GET';
                    return service.sendRest(url,sql,requestMethod,null);
                } else {
                    let deferred = $q.defer();
                    let ret, bts, orders;
                    service.getOrdersWithGroupStep1().then(function (res) {
                        ret = res;
                        return service.getOrdersWithGroupStep2(res);
                    }).then(function (btus) {
                        bts = btus;
                        return service.getOrdersWithGroupStep3();
                    }).then(function (os) {
                        orders = os;
                        return service.getOrdersWithGroupStep4(bts, orders);
                    }).then(function (res) {
                        ret = res;
                        deferred.resolve(ret);
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
                    return deferred.promise;
                }
            };

            this.getOrdersWithGroupStep1 = function(){
                let deferred = $q.defer();
                let sql =  "select {BTU__c:_soup} from {BTU__c} order by {BTU__c:Manager__c}";
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
                    console.error(err);
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            this.getOrdersWithGroupStep2 = function(Ids) {
                let deferred = $q.defer();

                if(Ids == null || Ids.userIds == null || Ids.userIds.length < 1){
                    deferred.resolve(null);
                    return deferred.promise;
                }
                let sql =  "select {User:_soup} from {User} ";
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
                    console.error(err);
                    deferred.reject(err);
                });
                return deferred.promise;
            };


            this.getOrdersWithGroupStep3 = function() {
                let deferred = $q.defer();
                let ret;
                service.getOrdersWithGroupStep3_1().then(function (res){
                    ret = res;
                    return service.getOrdersWithGroupStep3_2(res);
                }).then(function (orders) {
                    ret = orders;
                    deferred.resolve(ret);
                }).catch(function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            };

            this.getOrdersWithGroupStep3_1 = function(){
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
                    console.error(err);
                    deferred.reject(err);
                });
                return deferred.promise;
            };


            this.getOrdersWithGroupStep3_2 = function(Ids) {
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
                    console.error(err);
                    deferred.reject(err);
                });
                return deferred.promise;
            };


            this.getOrdersWithGroupStep4 = function(Ids,orders) {
                let deferred = $q.defer();
                try {
                    let results = [];

                    if(Ids == null || Ids.length < 1){
                        deferred.resolve(null);
                        return deferred.promise;
                    }

                    let userIds = [];
                    angular.forEach(Ids, function (btu) {
                        if(btu.Manager__c != null){
                            let each = new Object();
                            each.userId = btu.Manager__c;
                            each.userName = btu.Manager__r == null? null : btu.Manager__r.Name;
                            each.Team_Leader__c = btu.Team_Leader__c;
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


                    let resultCurrent = [];
                    let resultsOther = [];
                    //let resultsAll = [];
                    angular.forEach(results, function (re) {
                        if(re.userId == LocalCacheService.get('currentUser').Id){
                            resultCurrent.push(re);
                        }else{
                            resultsOther.push(re);
                        }
                    });
                    let resultsAll = resultCurrent.concat(resultsOther);
                    deferred.resolve(resultsAll);
                    //deferred.resolve(result);
                } catch (err) {
                    console.error(err);
                    deferred.reject(err);
                }
                return deferred.promise;
            };





            //Util Methods Start.
            this.buildURL = function (str_type,str_param) {
                return 'type=' + str_type;
            };

            this.sendRest = function (url,param,requestMethod,str_fields) {
                var deferred = $q.defer();
                ForceClientService.getForceClient().apexrest(hosturl + url, requestMethod, {}, {param:param}, function (response) {
                    response = service.fixAllFieldsForResult(str_fields,response);
                    deferred.resolve(response);
                }, function (error) {
                    console.log('Service1Service::sendRest::param::',url,'::',param);
                    console.log('Service1Service::sendRest::error::',error);
                    deferred.reject('sendRest::error::'+error);
                });

                return deferred.promise;
            };

            this.buildJSONURL = function (str_type,str_param) {
                return 'type=' + str_type +'&param='+ str_param;
            };

            this.sendJSONRest = function (url,param,requestMethod,str_fields) {
                var deferred = $q.defer();
                ForceClientService.getForceClient().apexrest(hosturl + url, requestMethod, {}, null , function (response) {
                    response = service.fixAllFieldsForResult(str_fields,response);
                    deferred.resolve(response);
                }, function (error) {
                    console.log('Service1Service::sendJSONRest::param::',url);
                    console.log('Service1Service::sendJSONRest::error::',error);
                    deferred.reject('sendJSONRest::error::'+error);
                });

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


            this.fixAllFieldsForResult = function (str_fields,result) {
                if(str_fields != null && str_fields != '') {
                    var strs = new Array();
                    strs = str_fields.split(",");
                    console.log('fixAllFieldsForResult::result::',result);
                    console.log('fixAllFieldsForResult::str_fields::',str_fields);
                    if(result != null && !isNaN(result.length) && Number(result.length) >0) {
                        for (let i = 0; i < result.length; i++) {
                            for (let j = 0; j < strs.length; j++) {
                                if(result[i][strs[j]] == null){
                                    result[i][strs[j]] = null;
                                }
                            }
                        }
                    } else if(result != null && result.length == null){
                        for (let j = 0; j < strs.length; j++) {
                            if(result[strs[j]] == null){
                                result[strs[j]] = null;
                            }
                        }
                    } else {
                        return null;
                    }
                    console.log('fixAllFieldsForResult::result2::',result);
                    return result;
                } else {
                    return result;
                }
            };
        //Service1Service content End.
        });
})();











