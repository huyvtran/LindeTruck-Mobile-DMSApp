(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:AccountService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('AccountService', function($q, $log, LocalDataService, SMARTSTORE_COMMON_SETTING) {

            let service = this;

            /**
             * @func  searchAccounts
             * @desc  search (fuzzy) Account list by account name or account sap number
             * @param {String} keyword - part of account name or account sap number
             * @returns {Promise} [Account] - Account list, including Id, Name, SAP_Number__c
             */

            this.searchAccounts = function(keyword){
                console.log('searchAccounts.keyword:%s', keyword);
                let deferred = $q.defer();

                let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Name} like '%"+keyword+"%'\
                             or {Account:SAP_Number__c} like '%"+keyword+"%'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let accounts = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            accounts.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                SAP_Number__c: entry[0].SAP_Number__c
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

            /**
             * @func  getAccount
             * @desc  get Account (basic info) by Id
             * @param {String} Id - Account.Id
             * @returns {Promise} Object - Account {Id:"xxx", Name:"xxx", SAP_Number__c:"xxx", Address__c:"xxx"]}
             */
            this.getAccount = function(Id) {
                console.log('getAccount.Id:%s', Id);
                let deferred = $q.defer();

                let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Id}='"+Id+"'";
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
                                Sale_Group_Code__c: entry[0].Sale_Group_Code__c
                            };
                        });
                    }
                    deferred.resolve(account);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getAccount::', deferred.promise);
                return deferred.promise;
            };

            this.getUser = function(Id) {
                console.log('getUser.Id:%s', Id);
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
                                Name: entry[0].Name
                            };
                        });
                    }
                    deferred.resolve(user);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getUser::', deferred.promise);
                return deferred.promise;
            };


            this.getBTU = function(Id) {
                console.log('getBTU.Id:%s', Id);
                let deferred = $q.defer();

                let sql =  "select {BTU__c:_soup}\
                         from {BTU__c}\
                         where {BTU__c:Id}='"+Id+"'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let BTU;
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            BTU = {
                                Id: entry[0].Id,
                                Name: entry[0].Name
                            };
                        });
                    }
                    deferred.resolve(BTU);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getBTU::', deferred.promise);
                return deferred.promise;
            };

            this.getContacts = function(AccountId) {
                let deferred = $q.defer();

                let sql =  "select {Contact:_soup}\
                         from {Contact}\
                         where {Contact:AccountId}='"+AccountId+"'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let contacts = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            contacts.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                MobilePhone: entry[0].MobilePhone,
                                Phone: entry[0].Phone
                            });
                        });
                    }
                    deferred.resolve(contacts);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getContacts::', deferred.promise);
                return deferred.promise;
            };


            this.getAccountWithDetails = function(Id){
                console.log('getAccountWithDetails:::'+Id);
                let deferred = $q.defer();
                service.getAccount(Id).then(function(account){
                    account.Salesman__r = service.getUser(account.Salesman__c);
                    account.BTU__r = service.getBTU(account.Sale_Group_Code__c);
                    deferred.resolve(account);
                }).catch(function(err){
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getAccountWithDetails::', deferred.promise);
                return deferred.promise;
            };


            /**
             * @func  getAccountWith360
             * @desc  get Account (basic info) with 360 view info by Id
             * @param {String} Id - Account.Id
             * @returns {Promise} Object - Account {Id:"xxx", Name:"xxx", SAP_Number__c:"xxx", Address__c:"xxx", Contacts: [{Id:"xxx", Name:"xxx"}]}

            this.getAccountWith360 = async function(Id) {
                try{
                    console.log('getAccountWith360.Id:%s', Id);
                    let account = await service.getAccount(Id);
                    account.Contacts = await service.getContacts(Id);
                    console.log('getAccountWith360::', account);
                    return account;
                } catch(err){
                    throw err;
                }
            };*/
        });
})();





























