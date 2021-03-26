//jshint ignore:start
angular
    .module('callers-blacklist', ['ui.select2', 'toggle-switch', 'angularUtils.directives.dirPagination', "api-param", "datetime-timezoned", "theme.form-directives"])
    .factory('BlacklistWebService', function ($q, $timeout, $http, $window, $rootScope, ApiParam) {
        'use strict';
        var BlacklistWebService = {};

        BlacklistWebService.saveBlackList = function (CallerId) {
            var req = {
                method: 'POST',
                url: ApiParam.baseURL() + "/v1/blacklist/bulk",
                headers: ApiParam.headerConfig().headers,
                data: CallerId
            };
            return $http(req)
        }

        BlacklistWebService.removeBlockedCallerId = function (CallerIds) {
            var req = {
                method: 'DELETE',
                url: ApiParam.baseURL() + "/v1/blacklist/",
                headers: ApiParam.headerConfig().headers,
                data: CallerIds
            };
            return $http(req)
        }

        BlacklistWebService.getGroups = function (callerId) {
            console.log('git to jenkins change');
            var req = {
                method: 'GET',
                url: ApiParam.baseURL() + "/v1/blacklist/org/" + callerId,
                headers: ApiParam.headerConfig().headers
            };
            return $http(req);

        }

        BlacklistWebService.getBlackList = function (page, number) {
            var req = {
                method: 'GET',
                url: ApiParam.baseURL() + "/v1/blacklist"  + "?page=" + page +"&search=" + number,
                headers: ApiParam.headerConfig().headers
            };
            return $http(req);
        };
        return BlacklistWebService
    })
    .controller('BlacklistController', ['$uibModal', '$scope', '$http', '$location', 'BlacklistWebService', '$window', '$rootScope', 'pinesNotifications', '$route', '$bootbox',
        function ($uibModal, $scope, $http, $location, BlacklistWebService, $window, $rootScope, pinesNotifications, $route, $bootbox) {
            'use strict';
            if ($rootScope.protect_caller_id === undefined || $rootScope.protect_caller_id === true || $rootScope.protect_caller_id === "true") {
                location.href = '#/access-denied';
            }
            $scope.search = {}
            $scope.search.number = ''
            $scope.callerIdList = [];
            $scope.checkAll = false
            $scope.selectedCallers = [];
            $scope.isLoadingApi = true;
            $scope.noDataVisibility = false;
            $scope.maskedSearchNumber = "";
            $scope.currentPage = 1;
            loadBlockedCallerIds()

            function loadBlockedCallerIds() {
                $scope.isLoadingApi = true;
                var checkSelectedCallers = []
                // $scope.callerIdList = [];

                $scope.maskedSearchNumber == undefined ? $scope.maskedSearchNumber = "" :$scope.maskedSearchNumber;
                var getBlacklistNumbers = BlacklistWebService.getBlackList($scope.currentPage, $scope.maskedSearchNumber.replace(/[^a-z\d]+/gi, "")).then(function (result) {
                    if (result.data.status != 'error') {
                        $scope.callerIdList = result.data.json.blacklistNumbers;
                        $scope.totalDataRows = result.data.json.totalRows;
                        if ($scope.callerIdList.length !== 0) {
                            $scope.noDataVisibility = false
                        } else {
                            $scope.isCheckAll=false
                            $scope.noDataVisibility = true
                        }
                        $scope.search.number = '';
                       // $scope.maskedSearchNumber=''
                        $scope.isCheckAll=false;
                    }else{
                        $scope.callerIdList = []
                    }
                    $scope.isLoadingApi = false;
                })
                _.each($scope.selectedCallers, function (selectedCallerId) {
                    checkSelectedCallers.push(selectedCallerId)
                })

               /* getBlacklistNumbers.then(function(){
                    if(!angular.isUndefined($scope.selectedCallers) && !angular.isUndefined($scope.callerIdList)){
                        if(checkSelectedCallers.length > 0){
                            _.each(checkSelectedCallers, function (selectedCallerId) {
                                for(var j = 0;j<$scope.callerIdList.length;j++){
                                    if (selectedCallerId == $scope.callerIdList[j].number) {
                                        $scope.callerIdList[j].isSelected=true;
                                    }
                                }
                            })
                        }
                    }
                })*/
            }

            $scope.pageChanged = function(newPage) {
                $scope.currentPage = newPage;
                loadBlockedCallerIds();
            }; 

            $scope.searchBlackListNumber =function(){
                loadBlockedCallerIds();
            }; 

            $scope.blockedGroupsInfo = function (callerId) {
                var uibModalInstance = $uibModal.open({
                    ariaLabelledBy: 'modal-title',
                    ariaDescribedBy: 'modal-body',
                    templateUrl: './views/blockedgroupsinfomodel.html',
                    controller: 'BlacklistModelController',
                    scope: $scope,
                    backdrop: 'static',
                    keyboard: false,
                    size: 'lg',
                    resolve: {
                        callerId: function () {
                            return callerId;
                        }
                    }
                });
            };

            $scope.checkAllToggle = function () {
                // isCheckAll is changed
                if ($scope.search.number.length > 0) {
                    angular.forEach($scope.callerIdList, function (callerId) {
                        if (callerId.number.indexOf($scope.search.number) > -1) {
                            callerId.isSelected = $scope.isCheckAll
                            if ($scope.isCheckAll) {
                                $scope.selectedNumberToggle('add', callerId)
                            }
                            else if (!$scope.isCheckAll) {
                                $scope.selectedNumberToggle('remove', callerId)
                            }
                        }
                    })
                } else {
                    $scope.selectedCallers = []
                    _.map($scope.callerIdList, function (callerId) {
                        callerId.isSelected = $scope.isCheckAll;
                        if ($scope.isCheckAll) {
                            $scope.selectedNumberToggle('add', callerId)
                        }
                        else if (!$scope.isCheckAll) {
                            $scope.selectedNumberToggle('remove', callerId)
                        }
                    })
                }
            }

            $scope.selectedNumberToggle = function (type, callerId) {
                var checkIfSelected = false
                switch (type) {
                    case 'add':
                        _.map($scope.selectedCallers, function (selectedCallerId) {
                            if (selectedCallerId == callerId.number) {
                                checkIfSelected = true
                            }
                        })
                        if (!checkIfSelected) {
                            $scope.selectedCallers.push(callerId.number)
                        }
                        break;

                    case 'remove':
                        $scope.selectedCallers.splice($scope.selectedCallers.indexOf(callerId.number), 1)
                        break;
                }
            }

            $scope.ischecked = function (callerId) {
                $scope.isCheckAll = false
                $scope.selectedCount = 0;
                if (callerId.isSelected) {
                    $scope.selectedNumberToggle('add', callerId)
                } else if (!callerId.isSelected) {
                    $scope.selectedNumberToggle('remove', callerId)
                }
                _.map($scope.callerIdList,function(data){  
                    if(data.isSelected === true){
                        $scope.selectedCount++;
                    }
                    else{
                        $scope.selectedCount--;
                    }
                })
                if($scope.callerIdList.length == $scope.selectedCount){
                    $scope.isCheckAll = true;
                }else{
                    $scope.isCheckAll = false;
                }
               
            };
            $scope.prettyNumber = function (data) {
                return data.replace(/(\d\d\d)(\d\d\d)(\d\d\d\d)/, "($1) $2-$3");
            }

            $scope.deleteCallerId = function () {
                if ($scope.selectedCallers.length > 0) {
                    var deleteSelected = []
                    var selectedCallers = $scope.selectedCallers
                    if(!angular.isUndefined($scope.search.number)){
                        if($scope.search.number.length > 0){
                        for(var i=0;i<selectedCallers.length;i++){
                            if(selectedCallers[i].match($scope.search.number)){
                                deleteSelected.push({ 'id': selectedCallers[i] })
                            }  
                            }
                        }else{
                            _.map($scope.selectedCallers, function (number) {
                                deleteSelected.push({ 'id': number })
                            })

                        }
                    }else{
                        _.map($scope.selectedCallers, function (number) {
                            deleteSelected.push({ 'id': number })
                        })

                    }
                    var tagMsg = "Are you sure you want to delete selected Caller ID?";
                    $bootbox.confirm(tagMsg, function (clickedOK) {
                        if (clickedOK) {
                            BlacklistWebService.removeBlockedCallerId(deleteSelected).then(function (result) {
                                if (result.data.status !== 'error') {
                                    pinesNotifications.notify({
                                        title: 'Blacklist',
                                        text: 'Successfully removed Caller ID from BlackList.',
                                        type: 'success'
                                    });
                                    _.each(deleteSelected,function(deleteSelectedCaller){
                                        var selectedCallerIndex = $scope.selectedCallers.indexOf(deleteSelectedCaller.id)
                                        $scope.selectedCallers.splice(selectedCallerIndex, 1)
                                    })
                                    $scope.search.number="";
                                    $scope.maskedSearchNumber="";
                                    loadBlockedCallerIds()
                                } else {
                                    deleteSelected = []
                                    pinesNotifications.notify({
                                        title: 'Blacklist',
                                        text: 'Please try again.',
                                        type: 'error'
                                    });
                                }
                            })
                        }
                    });
                } else {
                    pinesNotifications.notify({
                        title: 'Blacklist',
                        text: 'Please select any number to delete.',
                        type: 'error'
                    });
                }
            }

            $scope.$watch('maskedSearchNumber', function (newValue, oldValue) {
                if ((!angular.isUndefined(newValue)) && (angular.isUndefined(oldValue))) {
                    // case 1: when new value is Not undefined and old value is undefined -> search.number =  new value
                    $scope.search.number = newValue.replace(/[^0-9]+/g, '')
                } else if ((!angular.isUndefined(newValue)) && (!angular.isUndefined(oldValue))) {
                    // case 2: when new value is Not undefined and old value is Not undefined -> search.number =  new value
                    $scope.search.number = newValue.replace(/[^0-9]+/g, '')
                } else if ((angular.isUndefined(newValue)) && (!angular.isUndefined(oldValue))) {
                    // case 3: when new value is undefined and old value is defined -> search.number = ''
                    $scope.search.number = ''
                } else if ((angular.isUndefined(newValue)) && (angular.isUndefined(oldValue))) {
                    // case 4: when new value is undefined and old value is undefined -> no need to handle
                    $scope.search.number = ''
                }
            })

            $scope.enableAddNumber = true
            $scope.$watch('addToBlacklist', function (newValue, oldValue) {
                if (!angular.isUndefined(newValue)) {
                    var newVal = newValue.replace(/[^0-9]+/g, '')
                    if (newVal.length == 10) {
                        $scope.enableAddNumber = false
                    } else {
                        $scope.enableAddNumber = true
                    }
                }
            })

            $scope.saveBlacklist = function () {
                $scope.isLoadingApi = true;
                if ($scope.addToBlacklist === undefined) {
                    pinesNotifications.notify({
                        title: 'Blacklist',
                        text: 'Please enter a valid phone number.',
                        type: 'error'
                    });
                } else {
                    $scope.addTempBlacklist = $scope.addToBlacklist.replace(/[^0-9]+/g, '')
                    if (($scope.addTempBlacklist.length == 10) && (!($scope.addTempBlacklist.slice(0, 1) === "0"))) {
                        var blacklistjson = {};
                        blacklistjson = {
                            caller_id: $scope.addTempBlacklist,
                            org_unit_id: $rootScope.currentOUId
                        }

                            BlacklistWebService.saveBlackList(blacklistjson).then(function (result) {
                                if (result.data.status != 'error') {
                                    loadBlockedCallerIds()
                                    $scope.isLoadingApi = false;
                                    pinesNotifications.notify({
                                        title: 'Blacklist',
                                        text: 'Successfully added Caller ID to BlackList.',
                                        type: 'success'
                                    });
                                    $scope.addNumberBlacklist.$setPristine()
                                    $scope.addToBlacklist = '';
                                }
                                else{
                                    pinesNotifications.notify({
                                        title: 'Blacklist',
                                        text: result.data.err,
                                        type: 'error'
                                    });
                                    $scope.isLoadingApi = false;
                                }
                            })
                    } else {
                        pinesNotifications.notify({
                            title: 'Blacklist',
                            text: 'Please enter a valid phone number.',
                            type: 'error'
                        });
                        $scope.isLoadingApi = false;
                    }
                }
                $scope.isCheckAll = false;
            };
        }
    ])
    .controller('BlacklistModelController', ['$uibModal', '$scope', '$http', '$location', 'BlacklistWebService', '$window', '$rootScope', 'pinesNotifications', '$route', 'callerId', '$bootbox',
        function ($uibModal, $scope, $http, $location, BlacklistWebService, $window, $rootScope, pinesNotifications, $route, callerId, $bootbox) {
            'use strict';
            if ($rootScope.protect_caller_id === undefined || $rootScope.protect_caller_id === true || $rootScope.protect_caller_id === "true") {
                location.href = '#/access-denied';
            }
            $scope.isLoadingApi = true;
            var ou = []
            var parent_org = []
            var top_org = []
            $scope.callerId = callerId;
            BlacklistWebService.getGroups($scope.callerId).then(function (result) {
                if (result.data.status != 'error') {
                    ou = _.uniq(_.pluck(result.data.json, "org_unit_name"));
                    parent_org = _.uniq(_.pluck(result.data.json, "top_org"));
                    top_org = _.uniq(_.pluck(result.data.json, "parent_org"));
                    $scope.groups = (_.pluck(result.data.json, "org_unit_name"));
                }
                else { console.log("error occoured while fetching groups info") }
                $scope.isLoadingApi = false;
            })
        }
    ]);
