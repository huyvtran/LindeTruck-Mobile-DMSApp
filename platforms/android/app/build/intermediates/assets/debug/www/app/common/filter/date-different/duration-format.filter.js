(function (angular) {

    'use strict';

    /**
     * @ngdoc filter
     * @name oinio.filter:durationFormatFilter
     *
     * @description filter to format a value in milliseconds to breakup in days:hours:minutes:seconds
     */
    angular
        .module('oinio.common.filter')
        .filter('durationFormatFilter', durationFormatFilter);

    /**
     *
     * @return {Function}
     */
    function durationFormatFilter() {

        return function (value) {
            var days = Math.floor(value/86400000);
            value = value%86400000;
            var hours = Math.floor(value/3600000);
            value = value%3600000;
            var minutes = Math.floor(value/60000);
            value = value%60000;
            var seconds = Math.floor(value/1000);
            return (days? days + ' days ': '') + (hours? hours + ' h ': '') + (minutes? minutes + ' m ': '') + (seconds? seconds + ' s ': '')
        }
    }
})(angular);