(function (moment) {
    'use strict';
    /**
     * converts an iso UTC timestamp to a formatted local timezone timestamp
     */
    angular.module('oinio.common.filter')
        .filter('localDate', function ($filter, LocalesService) {
            return function (utcDate, timezone, format) {
                if (!format) {
                    format = LocalesService.getDateTimeFormat();
                }

                return moment(utcDate).utc().tz(timezone).format(format);
            };
        });
})(moment);
