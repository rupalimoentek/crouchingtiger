angular.module('theme.cf-models')
  .service('CFModel', ['$rootScope', '$http', function($rootScope, $http) {
    'use strict';
    /**
     * Creates an instance of Model.
     *
     * @constructor
     * @this {Model}
     */
    var CFModel = function() {
        this.all = [];
        this.dimensions = [];
        this.format = d3.time.format('%x');
    };

    /**
     * Fetch uses the url set on the class to $http.get a response from the API
     * We call the parse function on the response which returns a list of unfiltered data
     *
     * @return {object} A promise object?
     */
    CFModel.prototype.fetch = function() {
        var self = this;
        if (!this.url) { throw new Error('You must specify a url on the class'); }
        return $http.get(self.url).success(function(response) { self.all = self.parse(response); });
    };

    /**
     * Get object of a specified ID
     *
     * @param {string} value to lookup
     * @return {object} with associated ID
     */
    CFModel.prototype.get = function(id) {
        return _.find(this.all, function(item) {
            return item.id === id;
        });
    };

    /**
     * A function called on the response object that returns the raw model data
     * This is overridden for each subclass of model for different paths to the data
     *
     * @param {object} response The response returned from the API
     * @return {array} A list of models extracted from the response
     */
    CFModel.prototype.parse = function(response) {
        return response;
    };

    /**
     * Loop through all of the model's crossfilter dimensions and reset their filters
     */
    CFModel.prototype.resetAllDimensions = function() {
        _.each(this.dimensions, function (dimension) {
            dimension.filterAll();
        });
    };

    /**
     * Loop through the Model's dataSet hash
     * Each key/value pair corresponds to a data set name/exclusion list
     * Create and set a data list for each key/value pair in the hash
     *
     * @param {object} filterData A hash data required by the filters
     */
    CFModel.prototype.runFilters = function(filterData) {
        var self = this;
        this.filterData = filterData;
        _.each(this.dataSets, function(exclusions, setName) {
            self.resetAllDimensions();
            self.applyFilters(exclusions);
            self[setName] = self.byName.bottom(Infinity);
        });

        _.each(this.groups, function(group, groupName){
            self[groupName] = group.all();
        });
    };

    /**
     * Apply all the filters attached to the Model except those specified in exlusions
     *
     * @param {array} exclusions An array of filters we do not want to be applied to a data set
     */
    CFModel.prototype.applyFilters = function(exclusions) {
        var self = this;
        exclusions = exclusions || [];
        _.each(this.filters, function(filterFunction, filterName) {
            if(!_.contains(exclusions, filterName)) {
                filterFunction.bind(self)();
            }
        });
    };

    /**
     * Returns a count of objects in the model
     *
     * @return {number} A count of all, unfiltered, objects
     */
    CFModel.prototype.count = function() {
        return this.all.length;
    };

    /**
    * Returns whether any entry of an array of items falls within a number range.
    *
    * @param {array} list of numbers to check with
    * @param {array} a number range to check against
    * @return {boolean} whether the number list contains a value within the range
    */
    CFModel.prototype.anyItemFallsWithinRange = function(items, range) {
        if(range.length === 0) { return true; }
        if(items.length === 0) { return false; }


        for(var i = 0; i < items.length; i++) {
            if(this.fallsWithinRange(items[i], range)) {
                return true;
            }
        }

        return false;
    };
    
    /**
    * Returns whether any single item falls within a number range.
    *
    * @param {object} an item to check
    * @param {array} a number range to check against
    * @return {boolean} whether the item is within the range
    */
    CFModel.prototype.fallsWithinRange = function(item, range) {
        return item >= range[0] && item <= range[1];
    };

    return new CFModel();
}]);