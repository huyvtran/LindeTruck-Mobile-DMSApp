(function () {

    'use strict';

    angular
        .module('oinio.common.directives')
        .directive('searchBoxInline', SearchBoxInline);

    /**
     * @desc This is a directive of search inline box
     *
     * @func SearchBoxInline
     * @constructor
     */
    function SearchBoxInline() {

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
                placeholder: '@placeholder',
                onClear: '&'
            },
            templateUrl: 'app/common/directives/search/inline/templates/search-box.inline.view.html'
        };
    }
})();
