(function (angular) {

    'use strict';

    /**
     * @ngdoc filter
     * @name oinio.filter:DateDifferent
     *
     * @description
     */
    angular
        .module('oinio.common.filter')
        .filter('oinioFilterDateDifferent', oinioFilterDateDifferent);

    /**
     *
     * @return {Function}
     */
    function oinioFilterDateDifferent() {

        var magicNumber = (1000 * 60 * 60 * 24);

        return function (toDate, fromDate) {
            if (toDate && fromDate) {
                var dayDiff = Math.floor((toDate - fromDate) / magicNumber);
                if (angular.isNumber(dayDiff)) {
                    return dayDiff;
                }
            }
        };
    }
})(angular);