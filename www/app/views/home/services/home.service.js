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
                            Status__c: entry[0].Status__c
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
                                    Name: entry[0].Name
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
                                    Name: entry[0].Name
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


    });
