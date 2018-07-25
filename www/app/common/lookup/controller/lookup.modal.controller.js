(function () {

    'use strict';

    /**
     * Module oinio.common.lookup LookupModalController
     */
    angular.module('oinio.common.lookup')
        .controller('LookupModalController', function ($scope, $log, LookupModalService, parameters) {

            var vm = this;

            vm.lookups = [];
            vm.hasNextPage = false;
            vm.searchTerm = '';
            vm.objectType = parameters.objectType;
            vm.searchField = parameters.searchField || 'Name';
            vm.label = parameters.label || '';
            vm.recordTypeDeveloperName = parameters.recordTypeDeveloperName || '' ;

            var _cursor;
            var _currentPage;

            /**
             * execute the lookup search
             */
            function processLookupSearch() {
                LookupModalService.searchLookup(vm.objectType, vm.searchTerm, vm.searchField, vm.recordTypeDeveloperName).then(function (lookups) {
                    _cursor = lookups.cursor;
                    _currentPage = lookups.currentPage;
                    vm.hasNextPage = lookups.hasNextPage;

                    // update view model
                    vm.lookups = lookups.lookups;
                });
            }

            /**
             * @func
             * @desc
             */
            $scope.$on('modal.shown', function () {
                vm.getLookups(false);
            });

            /**
             * @func    getLookups()
             * @desc
             *
             * @param   {boolean} isClearSearch
             */
            vm.getLookups = function (isClearSearch) {

                if (isClearSearch) {
                    vm.searchTerm = '';
                }

                // process lookup search
                if (_cursor) {
                    // close old cursor before executing a new search
                    LookupModalService.resetSearch(_cursor).then(function () {
                        _cursor = null;
                        _currentPage = 0;
                        processLookupSearch();
                    });
                }
                else {
                    processLookupSearch();
                }
            };

            /**
             * load more lookups
             */
            vm.loadMoreLookups = function () {
                // load next page of lookup search
                LookupModalService.nextPage(_cursor, _currentPage).then(function (lookups) {
                    _cursor = lookups.cursor;
                    _currentPage = lookups.currentPage;
                    vm.hasNextPage = lookups.hasNextPage;

                    // update view model
                    vm.lookups = vm.lookups.concat(lookups.lookups);

                    // hide infinite scroll
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }, function (error) {

                    // hide infinite scroll
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
            };

            /**
             * @func setUser()
             * @desc
             */
            vm.setLookup = function (lookup) {
                // close cursor before leaving
                LookupModalService.resetSearch(_cursor).then(function () {
                    $scope.closeModal(lookup);
                });
            };

            /**
             * @func closeModal()
             * @desc
             */
            vm.closeModal = function () {
                // close cursor before leaving
                LookupModalService.resetSearch(_cursor).then(function () {
                    $scope.closeModal();
                });
            };
        });
})();
