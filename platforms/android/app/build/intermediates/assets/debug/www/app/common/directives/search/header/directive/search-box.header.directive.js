(function () {

    'use strict';

    angular
        .module('oinio.common.directives')
        .directive('searchBoxHeader', SearchBoxHeader);

    /**
     * @desc This is a directive of search box on nav title.
     *
     * @func SearchBoxHeader
     * @constructor
     */
    function SearchBoxHeader() {

        return {
            restrict: 'E',
            /*
             "@"   ( Text binding / one-way binding )
             "="   ( Direct model binding / two-way binding )
             "&"   ( Behaviour binding / Method binding  )
             */
            scope: {
                doSearch: '&submit',
                searchTerm: '=?ngModel',
                placeholder: '@placeholder'
            },
            templateUrl: 'app/common/directives/search/header/templates/search-box.header.view.html'
        };
    }
})();
