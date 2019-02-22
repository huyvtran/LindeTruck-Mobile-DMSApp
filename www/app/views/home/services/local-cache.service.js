(function (angular) {
    'use strict';

    /**
     * Mobule oinio.core LocalCacheService
     */
    angular.module('oinio.core')
        .service('LocalCacheService', function () {
            var service = this;

            service.data = {
                description: 'This object is cache! Don\'t delete this description!'
            };

            /**
             * set value in cache
             * @param {string} key
             * @param {object} value
             */
            service.set = function (key, value) {
                if (key === undefined) {
                    console.log('LocalCacheService.set(key,value) error,key parameter is empty!');
                } else {
                    if (value === undefined) {
                        service.data[key] = {};
                    } else {
                        service.data[key] = value;
                    }
                }
            };

            /**
             * get key value from cache
             * @param {string} key
             * @returns {*}
             */
            service.get = function (key) {
                if (key !== undefined) {
                    return service.data[key];
                } else {
                    console.log('Error: parameter error!');
                }
            };

            /**
             * delete key value from cache
             * @param {string} key
             * @returns {boolean}
             */
            service.del = function (key) {
                if (key === 'description' || key === undefined) {
                    return false;
                } else {
                    delete service.data[key];
                }
            };

            /**
             * empty complete cache
             */
            service.empty = function () {
                service.data = {
                    description: 'This object is cache! don\'t delete this description!!!'
                };
            };

            /**
             * get complete cache
             * @returns {{description: string}|*}
             */
            service.all = function () {
                return service.data;
            };
        });
})(angular);
