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


    });
