
(function(){

'use strict';

function Calender($timeout,picker){
    
	return {
	  restrict : 'E',
	  replace:false,
      require: ['^ngModel', 'smCalender'],
      scope :{
	      	minDate: "=",
	      	maxDate: "=",
	      	initialDate : "=",
	      	format: '@',
	      	mode: '@',
	      	startView:'@',	      	
	      	weekStartDay:'@',
	      	disableYearSelection:'@',
	      	dateSelectCall : '&'
	    },
		transclude: true,
	   	controller:["$scope","$timeout","picker","$mdMedia",CalenderCtrl],
	    controllerAs : 'vm',
	    templateUrl:"picker/calender-date.html",
		link : function(scope,element,attr,ctrls){
			var ngModelCtrl = ctrls[0];
	        var calCtrl = ctrls[1];
	        calCtrl.configureNgModel(ngModelCtrl);

	        
		}      
	}
}

var CalenderCtrl = function($scope,$timeout,picker,$mdMedia){
	var self  = this;

	self.$scope = $scope;
	self.$timeout = $timeout;
    self.picker = picker;
    self.dayHeader = self.picker.dayHeader;
	self.initialDate = $scope.initialDate; 	
    self.viewModeSmall = $mdMedia('xs');
	self.startDay = angular.isUndefined($scope.weekStartDay) || $scope.weekStartDay==='' ? 'Sunday' : $scope.weekStartDay ;	   	
	self.minDate = $scope.minDate;			//Minimum date 
	self.maxDate = $scope.maxDate;			//Maximum date 
	self.mode = angular.isUndefined($scope.mode) ? 'DATE' : $scope.mode;
	self.format = $scope.format;
	self.restrictToMinDate = angular.isUndefined($scope.minDate) ? false : true;
	self.restrictToMaxDate = angular.isUndefined($scope.maxDate) ? false : true;
	self.stopScrollPrevious =false;
	self.stopScrollNext = false;
	self.disableYearSelection = $scope.disableYearSelection;
	self.monthCells=[];
	self.dateCellHeader= [];	
	self.dateCells = [];
	self.monthList =  moment.monthsShort();
	self.moveCalenderAnimation='';

	self.format = angular.isUndefined(self.format) ? 'MM-DD-YYYY': self.format;
	self.initialDate =	angular.isUndefined(self.initialDate) ? moment(): moment(self.initialDate,self.format);
	self.currentDate = self.initialDate.clone();

	if(self.restrictToMinDate) 
		self.minDate = moment(self.minDate, self.format);
	if(self.restrictToMaxDate) 
		self.maxDate = moment(self.maxDate, self.format);

    self.yearItems = {
        currentIndex_: 0,
        PAGE_SIZE: 7,
        START: 1900,
        getItemAtIndex: function(index) {
            if(this.currentIndex_ < index)
                this.currentIndex_ = index;
            return this.START + index;
        },
        getLength: function() {
            return this.currentIndex_ + Math.floor(this.PAGE_SIZE / 2);
        }
    };	

	// console.log('YEAR ITEMS', self.yearItems);

	var initialzed = false;
	self.init();

	self.$scope.$watch("initialDate", function(newValue, oldValue) {
		if (newValue) {
			if (!initialzed) {
				self.initialDate = moment(newValue);
				self.currentDate = moment(newValue);
				self.buildDateCells();
				initialzed = true;
			}
		}
	})
}

CalenderCtrl.prototype.setInitDate = function(dt) {
    var self = this;
    self.initialDate =angular.isUndefined( dt) ? moment(): moment( dt,self.format);
  };


CalenderCtrl.prototype.configureNgModel = function(ngModelCtrl) {
    var self = this;

    self.ngModelCtrl = ngModelCtrl;

    ngModelCtrl.$render = function() {
      self.ngModelCtrl.$viewValue= self.currentDate;
    };
  };

  CalenderCtrl.prototype.setNgModelValue = function(date) {
  	var self = this;
    self.ngModelCtrl.$setViewValue(date);
    self.ngModelCtrl.$render();
  };

CalenderCtrl.prototype.init = function(){
	var self = this;
	self.buildDateCells();
	self.buildDateCellHeader();
	self.buildMonthCells();
	self.setView()
  	self.showYear();
};

CalenderCtrl.prototype.setView = function(){
	var self = this;
	self.headerDispalyFormat = "ddd, MMM DD";
	switch(self.mode) {
	    case 'date-time':
			self.view = 'DATE'
			self.headerDispalyFormat = "ddd, MMM DD HH:mm";			
	        break;
	    case 'time':
	        self.view = 'HOUR';
			self.headerDispalyFormat = "HH:mm";
	        break;
	    default:
	        self.view = 'DATE';
	}	
}


CalenderCtrl.prototype.showYear = function() { 
	var self = this;
    self.yearTopIndex = (self.initialDate.year() - self.yearItems.START) + Math.floor(self.yearItems.PAGE_SIZE / 2);
    self.yearItems.currentIndex_ = (self.initialDate.year() - self.yearItems.START) + 1;
};


CalenderCtrl.prototype.buildMonthCells = function(){
	var self = this;
	self.monthCells = moment.months();
};

CalenderCtrl.prototype.buildDateCells = function(){
	var self = this;
	var currentMonth = self.initialDate.month();
    var calStartDate  = self.initialDate.clone().date(0).day(self.startDay);
    var calMinStart  = self.initialDate.clone().date(0);
    var weekend = false;
    var isDisabledDate =false;


    /*
    	Check if min date is greater than first date of month
    	if true than set stopScrollPrevious=true 
    */
	if(!angular.isUndefined(self.minDate)){	
		self.stopScrollPrevious	 = self.minDate.unix() > calMinStart.unix();
	}

    self.dateCells =[];
	for (var i = 0; i < 6; i++) {
		var week = [];
		for (var j = 0; j < 7; j++) {
			
			var isCurrentMonth = (calStartDate.month()=== currentMonth);	

			isDisabledDate = isCurrentMonth? false:true; 
			//if(isCurrentMonth){isDisabledDate=false}else{isDisabledDate=true};

			if(self.restrictToMinDate && !angular.isUndefined(self.minDate) && !isDisabledDate)
				isDisabledDate = self.minDate.isAfter(calStartDate);
			
			if(self.restrictToMaxDate && !angular.isUndefined(self.maxDate) && !isDisabledDate)
				isDisabledDate = self.maxDate.isBefore(calStartDate);
		
			var  day = {
	            date : calStartDate.clone(),
	            dayNum: isCurrentMonth ? calStartDate.date() :"",
	            month : calStartDate.month(),
	            today: calStartDate.isSame(moment(),'day') && calStartDate.isSame(moment(),'month'),
	            year : calStartDate.year(),
	            dayName : calStartDate.format('dddd'),
	            isWeekEnd : weekend,
	            isDisabledDate : isDisabledDate,
	            isCurrentMonth : isCurrentMonth
			};
			
			week.push(day);
            calStartDate.add(1,'d')
		}
		self.dateCells.push(week);
	}
    /*
    	Check if max date is greater than first date of month
    	if true than set stopScrollPrevious=true 
    */
	if(self.restrictToMaxDate && !angular.isUndefined(self.maxDate)){	
		self.stopScrollNext	= self.maxDate.unix() < calStartDate.unix();
	}

	if(self.dateCells[0][6].isDisabledDate && !self.dateCells[0][6].isCurrentMonth){
		self.dateCells[0].splice(0);
	}

};

CalenderCtrl.prototype.changePeriod = function(c){
	var self = this;
	if(c === 'p'){
		if(self.stopScrollPrevious) return;
		// self.moveCalenderAnimation='slideLeft';
		self.initialDate.subtract(1,'M');
	}else{
		if(self.stopScrollNext) return;
		// self.moveCalenderAnimation='slideRight';
		self.initialDate.add(1,'M');
	}

	self.buildDateCells();
	// self.$timeout(function(){
	// 	self.moveCalenderAnimation='';
	// },100);
};


CalenderCtrl.prototype.selectDate = function(d, isDisabled){
	var self = this;
	if (isDisabled) return;
	self.currentDate = d;
	self.$scope.dateSelectCall({date:d});
	self.setNgModelValue(d);
	self.$scope.$emit('calender:date-selected');

};


CalenderCtrl.prototype.buildDateCellHeader = function(startFrom){
	var self = this;
	var daysByName = self.picker.daysNames;
	
	var keys = [];
	for (var key in daysByName) {
		keys.push(key)
	}
	var startIndex = moment().day(self.startDay).day(), count = 0;
	for (var key in daysByName) {

    	self.dateCellHeader.push(daysByName[ keys[ (count + startIndex) % (keys.length)] ]);
        count++; // Don't forget to increase count.
    }  
}
/*
	Month Picker
*/

CalenderCtrl.prototype.changeView = function(view){
	var self = this;
	if(self.disableYearSelection){
		return;
	}else{ 
	    if(view==='YEAR_MONTH'){
	   		self.showYear();
    	}
   		self.view =view;
	}
}

/*
	Year Picker
*/


CalenderCtrl.prototype.changeYear = function(yr,mn){
	var self = this;
	self.initialDate.year(yr).month(mn);
	self.buildDateCells();
	self.view='DATE';	
};

/*
	Hour and Time
*/


CalenderCtrl.prototype.setHour = function(h){
	var self = this;
	self.currentDate.hour(h);
}

CalenderCtrl.prototype.setMinute = function(m){
	var self = this;
	self.currentDate.minute(m);
}

CalenderCtrl.prototype.selectedDateTime = function(){
	var self = this;
	self.setNgModelValue(self.currentDate);
	if(self.mode === 'time') 
		self.view='HOUR' 
	else 
		self.view='DATE';	
	self.$scope.$emit('calender:close');		
}

CalenderCtrl.prototype.closeDateTime = function(){
	var self = this;
	if(self.mode === 'time') 
		self.view='HOUR' 
	else 
		self.view='DATE';
	self.$scope.$emit('calender:close');
}





var app = angular.module('smDateTimeRangePicker',[]);

app.directive('smCalender',['$timeout','picker',Calender]);

})();
(function(){

'use strict';

function TimePicker(){
	return {
	  restrict : 'E',
	  replace:true,
      require: ['^ngModel', 'smTime'],
      scope :{
	      	initialTime : "@",
	      	format:"@",
	      	timeSelectCall : '&'	      	
	    },
		transclude: true,
	   	controller:["$scope","$timeout",TimePickerCtrl],
	    controllerAs : 'vm',
	    templateUrl:"picker/calender-hour.html",
		link : function(scope,element,att,ctrls){
			var ngModelCtrl = ctrls[0];
	        var calCtrl = ctrls[1];
	        calCtrl.configureNgModel(ngModelCtrl);

		}      
	}
}

var TimePickerCtrl = function($scope,$timeout){
	var self  = this;
	self.uid = Math.random().toString(36).substr(2,5);
	self.$scope = $scope;
	self.$timeout = $timeout;
	self.initialDate = $scope.initialTime; 	//if calender to be  initiated with specific date 
	self.format = $scope.format;
	self.hourItems =[];
	self.minuteCells =[];
	self.format = angular.isUndefined(self.format) ? 'HH:mm': self.format;
	self.initialDate =	angular.isUndefined(self.initialDate)? moment() : moment(self.initialDate,self.format);
	self.currentDate = self.initialDate.clone();
	self.hourSet =false;
	self.minuteSet = false;

	self.show=true;
	
	$scope.$parent.$watch("vm.initialDate", function(newValue, oldValue) {
		if (newValue) {
			self.currentDate = moment(newValue);
		}
	})

	self.init();

}

TimePickerCtrl.prototype.init = function(){
	var self = this;
	self.buidHourCells();
	self.buidMinuteCells();
	self.headerDispalyFormat = "HH:mm";
	self.showHour();
};

TimePickerCtrl.prototype.showHour = function() { 
	var self = this;

	self.hourTopIndex = 22;
	self.minuteTopIndex	= (self.initialDate.minute() -0) + Math.floor(7 / 2);	
    //self.yearTopIndex = (self.initialDate.year() - self.yearItems.START) + Math.floor(self.yearItems.PAGE_SIZE / 2);	
//	self.hourItems.currentIndex_ = (self.initialDate.hour() - self.hourItems.START) + 1;
};

 TimePickerCtrl.prototype.configureNgModel = function(ngModelCtrl) {
    this.ngModelCtrl = ngModelCtrl;
    var self = this;
    ngModelCtrl.$render = function() {
      self.ngModelCtrl.$viewValue= self.currentDate;
    };
  };


  TimePickerCtrl.prototype.setNgModelValue = function(date) {
  	var self = this;
    self.ngModelCtrl.$setViewValue(date);
    self.ngModelCtrl.$render();
  };

TimePickerCtrl.prototype.buidHourCells = function(){
	var self = this;
	var hour;

	for (var i = 0 ; i <= 11; i++) {
		if (i === 0) {
			hour = {
				hour : 12 + ' am',
				isCurrent :(self.initialDate.hour()) === 12 + ' am',
				highlighter: 0 
			};
		} else {
			hour = {
				hour : i + ' am',
				isCurrent :(self.initialDate.hour()) === i,
				highlighter: i
			};
		}
		self.hourItems.push(hour);
	}

	for (var i = 0; i <= 11; i++) {
		if (i === 0) {
			hour = {
				hour : 12 + ' pm',
				isCurrent : (self.initialDate.hour()) === i,
				highlighter: 12
			};
		} else {
			hour = {
				hour : i + ' pm',
				isCurrent : (self.initialDate.hour()) === i,
				highlighter: i + 12
			};
		}
		self.hourItems.push(hour);
	}	
};

TimePickerCtrl.prototype.buidMinuteCells = function(){
	var self = this;
	self.minuteTopIndex	= self.initialDate.minute();
	for (var i = 0 ; i <= 59; i+=15) {
		var minute = {
			minute : i,
			isCurrent : (self.initialDate.minute())=== i,
		}
		self.minuteCells.push(minute);
	};
};


TimePickerCtrl.prototype.selectDate = function(d,isDisabled){
	var self = this;
	if (isDisabled) return;
	self.currentDate = d;

	self.$scope.$emit('calender:date-selected');

}


TimePickerCtrl.prototype.setHour = function(h) {
	var amPm;
	
	if (h.indexOf('am') !== -1) {
		amPm = h.indexOf('am');
		h = parseInt(h.substring(0, amPm - 1));

		if (h === 12) { h = 0; }
	} else if (h.indexOf('pm') !== 1) {
		amPm = h.indexOf('pm');
		h = parseInt(h.substring(0, amPm - 1));

		var uiHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
		var dirHours = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

		h = dirHours[uiHours.indexOf(h)];
	}
	var self = this;
	self.currentDate.hour(h);
	// Sets the ngModel value to what the user selected
	self.setNgModelValue(self.currentDate);
	// if (self.currentDate.hour(h)) {
	// 	self.$scope.$parent.vm.currentDate = self.currentDate.hour(h);
	// }
}

TimePickerCtrl.prototype.setMinute = function(m){
	var self = this;
	self.currentDate.minute(m);
	self.setNgModelValue(self.currentDate);
	// if (self.currentDate.minute(m)) {	
	// 	self.$scope.$parent.vm.currentDate = self.currentDate.minute(m);
	// }
}

TimePickerCtrl.prototype.selectedDateTime = function(){
	var self = this;
	self.setNgModelValue(self.currentDate);
	if(self.mode === 'time') {
		self.view='HOUR' 
	} else {
		self.view='DATE';
	} 
	self.$scope.$emit('calender:close');			
};

var app = angular.module('smDateTimeRangePicker');

app.directive('smTime',['$timeout',TimePicker]);


})();

(function(){

'use strict';

function DatePickerDir($timeout,picker,$mdMedia,$window){
	return {
	  restrict : 'E',
      require: ['^ngModel','smDatePicker'],
      replace: false,
      scope :{
	      	initialDate : "=",
	      	minDate	:"=",
	      	maxDate:"=",
	      	format:"@",
	      	mode:"@",	      	
	      	startDay:"@",
	      	closeOnSelect:"@",
	      	weekStartDay:"@",
	      	disableYearSelection: "@",
	      	onSelectCall : '&'	      	
	    },
		transclude: true,
	    controller: ['$scope','picker','$mdMedia',PickerCtrl],
	    controllerAs: 'vm',
	    bindToController:true,
	    templateUrl:"picker/date-picker.html",
		link : function(scope,element,att,ctrls){
		      var ngModelCtrl = ctrls[0];	
		      var calCtrl = ctrls[1];
		      calCtrl.configureNgModel(ngModelCtrl);
		}      
	}
}

var PickerCtrl = function($scope,picker,$mdMedia){
	var self = this;
	self.scope = $scope;
	self.okLabel = picker.okLabel;
	self.cancelLabel = picker.cancelLabel;	
	self.picker = picker;		
	self.$mdMedia =$mdMedia;
	self.init();
}

PickerCtrl.prototype.init = function() {
	var self = this;

	if(angular.isUndefined(self.mode) || self.mode ===''){
		self.mode = 'date';	
	}
	self.currentDate = angular.isUndefined(self.ngModelCtrl)  ? moment():  self.ngModelCtrl.$viewValue ;

	self.setViewMode(self.mode);
};

PickerCtrl.prototype.configureNgModel = function(ngModelCtrl) {
    var self = this;
    self.ngModelCtrl = ngModelCtrl;
    self.ngModelCtrl.$render = function() {
      self.ngModelCtrl.$viewValue= ngModelCtrl.$viewValue;
      self.currentDate = angular.isUndefined(self.ngModelCtrl) ? moment(): moment(self.ngModelCtrl.$viewValue);
      self.ngModelCtrl.$modelvalue= ngModelCtrl.$modelvalue;
    };
};

PickerCtrl.prototype.setViewMode = function(mode){
	var self = this;
	switch(mode) {
			case 'date':
			self.view = 'DATE';
			self.headerDispalyFormat = "ddd, MMM DD hh:mm a";				        
			break;
		case 'date-time':
			self.view = 'DATE'
			self.headerDispalyFormat =  "ddd, MMM DD hh:mm a";			
			break;
		case 'time':
			self.view = 'TIME';
			self.headerDispalyFormat = "hh:mm a";
			break;
		default:
			self.headerDispalyFormat = "ddd, MMM DD ";
			self.view = 'DATE';
	}					
}

PickerCtrl.prototype.setNextView = function(){
	var self = this;
  switch (self.mode){
    case  'date':
        self.view = 'DATE';             
      break;
    case  'date-time':
		 self.view = self.view==='DATE' ? 'TIME':'DATE';
      break;
    default:
        self.view = 'DATE';
  }    
} 

// This function is fired when pressing OK
PickerCtrl.prototype.selectedDateTime = function(){
	var self = this;
	var date = moment(self.currentDate, this.format);

	if(!angular.isUndefined(self.selectedTime)){
		date.hour(self.selectedTime.hour()).minute(self.selectedTime.minute());
		self.setNgModelValue(date);
	} else {
		self.setNgModelValue(date);
	}

};

PickerCtrl.prototype.dateSelected = function(date){
	// console.log('INSIDE dateSelected IN picker.js: Date:', date);
	var self = this;
  	self.currentDate.date(date.date()).month(date.month()).year(date.year());
  	self.selectedDate = self.currentDate;
	
	// console.log('SELF', self);
	self.setNextView();	
}

PickerCtrl.prototype.timeSelected = function(time){
	var self = this;
  	self.currentDate.hours(time.hour()).minutes(time.minute());
  	self.selectedTime= self.currentDate;

  	if(self.closeOnSelect && self.mode==='date-time')
  		self.selectedDateTime();
  	else
  		self.setNextView();
}

PickerCtrl.prototype.setNgModelValue = function(date) {
    var self = this;
	self.onSelectCall({date: date});
    self.ngModelCtrl.$setViewValue(date.format(self.format));
    self.ngModelCtrl.$render();    
    self.closeDateTime();  
};

PickerCtrl.prototype.closeDateTime = function(){
	this.view = 'DATE';
	this.scope.$emit('calender:close');
}

function TimePickerDir($timeout,picker,$mdMedia,$window){
	return {
	  restrict : 'E',
      require: '^ngModel',
      replace:true,
      scope :{
	    initialDate : "@",
	    format:"@",
	    mode:"@",	      	
	    closeOnSelect:"@"
	},
	templateUrl:"picker/time-picker.html",
	link : function(scope,element,att,ngModelCtrl){
			setViewMode(scope.mode)
		    
		    scope.okLabel = picker.okLabel;
		    scope.cancelLabel = picker.cancelLabel;

			scope.currentDate = isNaN(ngModelCtrl.$viewValue)  ? moment(): ngModelCtrl.$viewValue ;

			scope.$mdMedia =$mdMedia;
			function setViewMode(mode){
				switch(mode) {
				    case 'date-time':
						scope.view = 'DATE'
						scope.headerDispalyFormat = "ddd, MMM DD HH:mm";			
				        break;
				    case 'time':
				        scope.view = 'HOUR';
						scope.headerDispalyFormat = "HH:mm";
				        break;
				    default:
				        scope.view = 'DATE';
				}					
			}

			scope.$on('calender:date-selected',function(){
				if(scope.closeOnSelect && (scope.mode!=='date-time' || scope.mode!=='time')){
					var date = moment(scope.selectedDate,scope.format);
					if(!date.isValid()){
						date = moment();
						scope.selectedDate =date;
					}
					if(!angular.isUndefined(scope.selectedTime)){	
						date.hour(scope.selectedTime.hour()).minute(scope.selectedTime.minute());
					}
					scope.currentDate =scope.selectedDate;
					ngModelCtrl.$setViewValue(date.format(scope.format));
					ngModelCtrl.$render();
					setViewMode(scope.mode)
					scope.$emit('calender:close');			

				}
			})

			scope.selectedDateTime = function(){
				var date = moment(scope.selectedDate,scope.format);
				if(!date.isValid()){
					date = moment();
					scope.selectedDate =date;
				}
				if(!angular.isUndefined(scope.selectedTime)){	
					date.hour(scope.selectedTime.hour()).minute(scope.selectedTime.minute());
				}
				scope.currentDate =scope.selectedDate;
				ngModelCtrl.$setViewValue(date.format(scope.format));
				ngModelCtrl.$render();
				setViewMode(scope.mode)
				scope.$emit('calender:close');			
			}


			scope.closeDateTime = function(){
				scope.$emit('calender:close');			
			}

		}      
	}
}


var app = angular.module('smDateTimeRangePicker');

app.directive('smDatePicker',['$timeout','picker','$mdMedia','$window',DatePickerDir]);
app.directive('smTimePicker',['$timeout','picker','$mdMedia','$window',TimePickerDir]);


})();

(function(){

'use strict';

var app = angular.module('smDateTimeRangePicker');


function DatePickerServiceCtrl($scope, $mdDialog, $mdMedia, $timeout,$mdUtil,picker){
    var self = this;

    if(!angular.isUndefined(self.options) && (angular.isObject(self.options))){
        self.mode = isExist(self.options.mode,self.mode); 
        self.format = isExist(self.options.format,'MM-DD-YYYY');
        self.minDate = isExist(self.options.minDate,undefined);
        self.maxDate = isExist(self.options.maxDate,undefined);
        self.weekStartDay = isExist(self.options.weekStartDay,'Sunday');
        self.closeOnSelect =isExist(self.options.closeOnSelect,false);
    }

    if(!angular.isObject(self.initialDate)){
        self.initialDate = moment(self.initialDate,self.format);
        self.selectedDate = self.initialDate;                  
    }

    self.currentDate = self.initialDate;
    self.viewDate = self.currentDate;

    self.view = 'DATE';
    self.$mdMedia = $mdMedia;
    self.$mdUtil = $mdUtil;

    self.okLabel = picker.okLabel;
    self.cancelLabel = picker.cancelLabel;         

    setViewMode(self.mode);

    function isExist(val,def){
        return angular.isUndefined(val)? def:val;
    }


    function setViewMode(mode){
        switch(mode) {
            case 'date':
                self.headerDispalyFormat = "ddd, MMM DD ";                     
            break;
            case 'date-time':
                self.headerDispalyFormat = "ddd, MMM DD HH:mm";            
            break;
            case 'time':
                self.headerDispalyFormat = "HH:mm";
            break;
            default:
                self.headerDispalyFormat = "ddd, MMM DD ";
        }                   
    }

    self.autoClosePicker = function(){
        if(self.closeOnSelect){        
            if(angular.isUndefined(self.selectedDate)){
              self.selectedDate = self.initialDate;
            }
            //removeMask();            
            $mdDialog.hide(self.selectedDate.format(self.format));
        }    
    }

    self.dateSelected = function(date){
        self.selectedDate = date;
        self.viewDate = date;
        if(self.mode==='date-time')  
            self.view = 'HOUR';
        else
            self.autoClosePicker();
    }

    self.timeSelected = function(time){
        self.selectedDate.hour(time.hour()).minute(time.minute());        
        self.viewDate = self.selectedDate;
        self.autoClosePicker();                
    }    

    self.closeDateTime = function(){
        $mdDialog.cancel();
        removeMask();
    }
    self.selectedDateTime = function(){
        if(angular.isUndefined(self.selectedDate)){
         self.selectedDate= self.currentDate;   
        }
        $mdDialog.hide(self.selectedDate.format(self.format));
        removeMask();
    }

    function removeMask(){
        var ele = document.getElementsByClassName("md-scroll-mask");
        if(ele.length!==0){ 
            angular.element(ele).remove();
        }            
    }

}


app.provider("smDateTimePicker", function() {
    
    this.$get = ["$mdDialog", function($mdDialog) {

        var datePicker = function(initialDate, options) {


            if (angular.isUndefined(initialDate)) initialDate = moment();


            if (!angular.isObject(options)) options = {};
            
            return $mdDialog.show({
                controller:  ['$scope','$mdDialog', '$mdMedia', '$timeout','$mdUtil','picker', DatePickerServiceCtrl],
                controllerAs: 'vm',
                bindToController: true,
                clickOutsideToClose: true,
                targetEvent: options.targetEvent,
                templateUrl: "picker/date-picker-service.html",
                locals: {
                    initialDate: initialDate,
                    options: options
                },
                skipHide: true
            });
        };
    
        return datePicker;
    }];
});


})();







function DateTimePicker($mdUtil, $mdMedia, $document, picker) {
    return {
        restrict: 'E',
        require: ['^ngModel','smDateTimePicker'],
        scope: {
            weekStartDay: '@',
            startView: "@",
            mode: '@',
            format: '@',
            minDate: '@',
            maxDate: '@',
            fname: "@",
            label: "@",
            isRequired: '@',
            disable: '=',
            noFloatingLabel: "=",
            disableYearSelection: '@',
            closeOnSelect: "@",
            onDateSelectedCall: "&"
        },
        controller: ['$scope', '$element', '$mdUtil', '$mdMedia', '$document', SMDateTimePickerCtrl],
        controllerAs: 'vm',
        bindToController:true,
        template: function (element,attributes){
          var inputType ="";
          if(attributes.hasOwnProperty('onFocus')){
            inputType =  '<input name="{{vm.fname}}" ng-model="vm.value" '
                  + '  type="text" placeholder="{{vm.label}}"'
                  + '  aria-label="{{vm.fname}}" ng-focus="vm.show()" data-ng-required="vm.isRequired"  ng-disabled="vm.disable" ng-readonly="true"' 
                  + '  server-error class="sm-input-container" />'
				  + '     <md-button tabindex="-1" class="sm-picker-icon md-icon-button" aria-label="showCalender" ng-disabled="vm.disable" aria-hidden="true" type="button" ng-click="vm.show()">'
                  + '					  <svg xmlns="http://www.w3.org/2000/svg" fill="#656b79" height="24" viewBox="0 0 24 24" width="24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
                  + '     </md-button>' ;

          }else{
             inputType = '      <input class="" name="{{vm.fname}}" ng-model="vm.value" '
                      + '             type="text" placeholder="{{vm.label}}" '
                      + '             aria-label="{{vm.fname}}" aria-hidden="true" data-ng-required="vm.isRequired"  ng-disabled="vm.disable" ng-readonly="true"/>' 
                      + '     <md-button tabindex="-1" class="sm-picker-icon md-icon-button" aria-label="showCalender" ng-disabled="vm.disable" aria-hidden="true" type="button" ng-click="vm.show()">'
                      + '					  <svg xmlns="http://www.w3.org/2000/svg" fill="#656b79" height="24" viewBox="0 0 24 24" width="24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
                      + '     </md-button>' ;

          }

          return  '  <md-input-container class="sm-input-container md-icon-float md-block" md-no-float="vm.noFloatingLabel">' + 
                    inputType +
                  '     <div id="picker" class="sm-calender-pane md-whiteframe-z2">' +
                  '          <sm-date-picker ' +
                  '              id="{{vm.fname}}Picker" ' +
                  '              initial-date="vm.value"' +
                  '              ng-model="vm.value"' +                  
                  '              mode="{{vm.mode}}" ' +
                  '              disable-year-selection={{vm.disableYearSelection}}' +
                  '              close-on-select="{{vm.closeOnSelect}}"' +
                  '              start-view="{{vm.startView}}" ' +
                  '              data-min-date="vm.minDate" ' + 
                  '              data-max-date="vm.maxDate"  ' + 
                  '              data-format="{{vm.format}}"  ' +
                  '              data-on-select-call="vm.onDateSelected(date)"' +
                  '              data-week-start-day="{{vm.weekStartDay}}" > ' +
                  '         </sm-date-picker>' +
                  '     </div>' +
                  ' </md-input-container>';    
        },
        link: function(scope, $element, attr, ctrl) {
          var ngModelCtrl = ctrl[0];
          var pickerCtrl = ctrl[1];
          pickerCtrl.configureNgModel(ngModelCtrl);
            

        }
    }
}
var SMDateTimePickerCtrl = function($scope, $element, $mdUtil, $mdMedia, $document) {
    var self = this;
    self.$scope = $scope;
    self.$element = $element;    
    self.$mdUtil = $mdUtil;
    self.$mdMedia = $mdMedia;
    self.$document = $document;
    self.isCalenderOpen = false;


    self.calenderHeight = 320;
    self.calenderWidth = 450;


    //find input button and assign to variable
    self.inputPane = $element[0].querySelector('.sm-input-container');
    
    //find Calender Picker  and assign to variable    
    self.calenderPane = $element[0].querySelector('.sm-calender-pane');
    //button to start calender        
    self.button = $element[0].querySelector('.sm-picker-icon');

    self.calenderPan = angular.element(self.calenderPane);

    //check if mode is undefied set to date mode 
    self.mode = angular.isUndefined($scope.mode) ? 'date' : $scope.mode;
    // check if Pre defined format is supplied
    self.format = angular.isUndefined($scope.format) ? 'MM-DD-YYYY' : $scope.format;

    self.calenderPan.addClass('hide hide-animate');

    self.bodyClickHandler = angular.bind(self,self.clickOutSideHandler);

	// This function fires on hitting the CANCEL button
	self.$scope.$on('calender:close', function() {
		// console.log('Self.value', self.value);

		//  PickerCtrl 
		self.$scope.$$childTail.vm.selectedDate = moment(self.value);
		self.$scope.$$childTail.vm.currentDate  = moment(self.value);
		if (self.$scope.$$childTail.vm.selectedTime) {
			self.$scope.$$childTail.vm.selectedTime = moment(self.value);
		}
		// console.log(self.$scope.$$childTail.vm);

		// Sets side header back to original date
		self.$scope.$$childTail.vm.currentDate = moment(self.value);
		self.$scope.$$childTail.vm.selectedDate = moment(self.value);

		//  TimePickerCtrl
		self.$scope.$$childTail.vm.scope.$$childTail.vm.currentDate = moment(self.value);

		//   CalenderCtrl 
		// Highlights original date
		self.$scope.$$childTail.$$childTail.$$prevSibling.vm.currentDate = moment(self.value);
		self.$scope.$$childTail.$$childTail.$$prevSibling.vm.initialDate = moment(self.value);

		self.$document.off('keydown');
		self.hideElement();
		setTimeout(function() {
			self.$scope.$$childTail.$$childTail.$$prevSibling.vm.buildDateCells();
		}, 1);
	});

    self.$scope.$on('$destroy', function() {
      self.calenderPane.parentNode.removeChild(self.calenderPane);
    }); 

    // if tab out hide key board
    angular.element(self.inputPane).on('keydown', function(e) {
      switch(e.which){
        case  27:
        case  9:
          self.hideElement();
            break;
        }
    });

}


SMDateTimePickerCtrl.prototype.configureNgModel = function(ngModelCtrl) {
    var self = this;
    self.ngModelCtrl = ngModelCtrl;


    self.ngModelCtrl.$formatters.push(function(dateValue) {
      if(angular.isUndefined(dateValue)) return;
      if(!dateValue ){return}; 
      self.setNgModelValue(dateValue);
    });    
      
};

SMDateTimePickerCtrl.prototype.setNgModelValue = function(date) {
  var self = this;
  self.onDateSelectedCall({date: date});
  var d = {};
  if(moment.isMoment(date)){
      d = date.format(self.format);
  }else{
      d = moment(date,self.format).format(self.format); 
  }  
  self.ngModelCtrl.$setViewValue(d);
  self.ngModelCtrl.$render();  
  self.value = d; 
};

SMDateTimePickerCtrl.prototype.onDateSelected = function(date){
  var self = this;
  self.setNgModelValue(date);
}



/*get visiable port

  @param : elementnRect 

  @param : bodyRect 

*/

SMDateTimePickerCtrl.prototype.getVisibleViewPort = function(elementRect, bodyRect) {
    var self = this;

    var top = 0;
    // if (elementRect.top + self.calenderHeight > bodyRect.bottom) {
    //     top = elementRect.top - ((elementRect.top + self.calenderHeight) - (bodyRect.bottom - 20));
    // }
    var left = 0;
    // if (elementRect.left + self.calenderWidth > bodyRect.right) {
    //     left = elementRect.left - ((elementRect.left + self.calenderWidth) - (bodyRect.right - 10));
    // }
	var bottom = 0;
    return {
        top: top,
        left: left,
		bottom: bottom
    };
}



SMDateTimePickerCtrl.prototype.show = function($event) {
  var self = this;
  var elementRect = self.inputPane.getBoundingClientRect();
  var bodyRect = document.body.getBoundingClientRect();

  self.calenderPan.removeClass('hide hide-animate');
  
  if (self.$mdMedia('sm') || self.$mdMedia('xs')) {
    self.calenderPane.style.left = (bodyRect.width - 320) / 2 + 'px';
    self.calenderPane.style.top = 'initial';    
	self.calenderPane.style.bottom = 0 + 'px';
  } else {
    var rect = self.getVisibleViewPort(elementRect, bodyRect);
    self.calenderPane.style.left = (rect.left) + 'px';
    self.calenderPane.style.top = 'initial';    
	self.calenderPane.style.bottom = 0 + 'px';
  }

//   document.body.appendChild(self.calenderPane);
//   angular.element(self.calenderPane).focus();
  var myEl = angular.element( document.querySelector( '#inner-editor' ) );
  myEl.append(self.calenderPane);
  angular.element(self.calenderPane).focus();
  
  self.calenderPan.addClass('show');
  self.$mdUtil.disableScrollAround(self.calenderPane);    
  
  
  self.isCalenderOpen =true;
  self.$document.on('click',self.bodyClickHandler);
}


SMDateTimePickerCtrl.prototype.tabOutEvent= function(element){
  var self = this;
    if (element.which === 9) {
      self.hideElement();
    }
}

SMDateTimePickerCtrl.prototype.hideElement= function() {
  var self = this;
  self.calenderPan.addClass('hide-animate');
  self.calenderPan.removeClass('show');
  self.$mdUtil.enableScrolling();

  if(self.button){
    angular.element(self.button).focus();    
  }
  self.$document.off('click'); 
  self.isCalenderOpen =false;

}


SMDateTimePickerCtrl.prototype.clickOutSideHandler = function(e){
  var self = this;
  if(!self.button){
    if ((self.calenderPane !== e.target && self.inputPane !== e.target ) && (!self.calenderPane.contains(e.target)  && !self.inputPane.contains(e.target))) {
      self.hideElement();
    }
  }else{
    if ((self.calenderPane !== e.target && self.button !== e.target ) && (!self.calenderPane.contains(e.target)  && !self.button.contains(e.target))) {
      self.hideElement();
    }
  }
}


var app = angular.module('smDateTimeRangePicker');
app.directive('smDateTimePicker', ['$mdUtil', '$mdMedia', '$document', 'picker', DateTimePicker]);
function picker(){
    var massagePath = "X";
    var cancelLabel = "Cancel";
    var okLabel = "Ok";
    var clearLabel = "Clear";
    var customHeader ={
        date:'ddd, MMM DD',
        dateTime:'ddd, MMM DD HH:mm',
        time:'HH:mm',
    }


    //date picker configuration
    var daysNames =  [
        {'single':'S','shortName':'Su','fullName':'Su startDate:nday'}, 
        {'single':'M','shortName':'Mo','fullName':'MonDay'}, 
        {'single':'T','shortName':'Tu','fullName':'TuesDay'}, 
        {'single':'W','shortName':'We','fullName':'Wednesday'}, 
        {'single':'T','shortName':'Th','fullName':'Thursday'}, 
        {'single':'F','shortName':'Fr','fullName':'Friday'}, 
        {'single':'S','shortName':'Sa','fullName':'Saturday'}
    ];

    var dayHeader = "single";

    var monthNames = moment.months();

    //range picker configuration
    var rangeDivider = "To";
    var rangeDefaultList = [
    		{	label:'Today',
    			startDate:moment().startOf('day'),
    			endDate:moment().endOf('day')
    		},
            {	label:'Last 7 Days',
            	startDate: moment().subtract(7,'d'),
            	endDate:moment()
            },
            {	
            	label:'This Month',
            	startDate:moment().startOf('month'), 
            	endDate: moment().endOf('month')
            },
            {
				label:'Last Month',
				startDate:moment().subtract(1,'month').startOf('month'),
				endDate: moment()
			},
            {
				label: 'This Quarter',
				startDate: moment().startOf('quarter'),
            	endDate: moment().endOf('quarter')
            },
            {
				label:  'Year To Date',
				startDate:  moment().startOf('year'),
            	endDate:  moment()
            },
            {
            	label:  'This Year',
				startDate:  moment().startOf('year'),
            	endDate:  moment().endOf('year')
            }/*, 
            { 
				label:  'Custom Range',
				startDate:  'custom',
				endDate: 'custom'
			}*/
		];

    var rangeCustomStartEnd =['Start Date','End Date'];            

	
    return{
		setMassagePath : function(param){
			massagePath = param;
		},
		setDivider : function(value){
			divider = value
		},  
        setDaysNames : function(array){
            daysNames =array;
        },
        setMonthNames : function(array){
            monthNames = array;
        }, 
        setDayHeader : function(param){
            dayHeader = param;
        },
        setOkLabel : function(param){
            okLabel = param;
        },               
        setCancelLabel : function(param){
            cancelLabel = param;
        },
	    setClearLabel : function(param){
		    clearLabel = param;
	    },
	    setRangeDefaultList : function(array){
            rangeDefaultList = array;
        },
        setRangeCustomStartEnd : function(array){
            rangeCustomStartEnd = array;
        },           
        setCustomHeader : function(obj){
            if(!angular.isUndefined(obj.date)){
                customHeader.date= obj.date;
            }
            if(!angular.isUndefined(obj.dateTime)){
                customHeader.dateTime= obj.dateTime;
            }
            if(!angular.isUndefined(obj.time)){
                customHeader.time= obj.time;
            }                        
        },               
		$get: function(){
			return {
				massagePath : massagePath,
                cancelLabel: cancelLabel,
                okLabel : okLabel,
                clearLabel : clearLabel,

                daysNames : daysNames,
                monthNames:monthNames,
                dayHeader :dayHeader,
                customHeader:customHeader,

                rangeDivider : rangeDivider,
                rangeCustomStartEnd : rangeCustomStartEnd,
                rangeDefaultList :rangeDefaultList                 
			}
		}
	}
}

var app = angular.module('smDateTimeRangePicker');

app.provider('picker',[picker]);
(function(){

'use strict';

function RangePickerInput($document,$mdMedia,$mdUtil,picker){
    return {
      restrict : 'EA',
      replace: true,
      require: ['^ngModel'],
      scope :{
        label : "@",
        fname : "@",
        isRequired : '@',
        closeOnSelect: '@',
        disable : '=',
        format : '@',
        mode : '@',
        divider: '@',
        showCustom:'@',
        weekStartDay :"@",
        customToHome: "@",
        customList: '=',
        noFloatingLabel:"=", 
        minDate : '@',
        maxDate : '@',
        allowClear : '@',
        allowEmpty : '@',
        onRangeSelect : '&'
      },
      controller: ['$scope', '$element', '$mdUtil', '$mdMedia', '$document', SMRangePickerCtrl],
      controllerAs: 'vm',
      bindToController:true,
      template: function (element,attributes){
        return ' <md-input-container md-no-float="vm.noFloatingLabel">'
                +'      <input name="{{vm.fname}}" ng-model="vm.value" ng-readonly="true"'
                +'             type="text" '
                +'             aria-label="{{vm.fname}}" ng-required="{{vm.isRequired}}" class="sm-input-container"'
                +'             ng-focus="vm.show()" placeholder="{{vm.label}}">'
                +'   <div id="picker" class="sm-calender-pane md-whiteframe-4dp" ng-model="value">'                
                +'    <sm-range-picker ng-model="vm.value" custom-to-home="{{vm.customToHome}}" custom-list="vm.customList" mode="{{vm.mode}}" min-date="{{vm.minDate}}"  max-date="{{vm.maxDate}}" range-select-call="vm.rangeSelected(range)" close-on-select="{{vm.closeOnSelect}}" show-custom="{{vm.showCustom}}" week-start-day="{{vm.weekStartDay}}"  divider="{{vm.divider}}" format="{{vm.format}}" allow-clear="{{vm.allowClear}}" allow-empty="{{vm.allowEmpty}}"></sm-range-picker>'
                +'   </div> '  
                +'  </md-input-container>';
      },
      link :  function(scope,$element,attr,ctrl){

            ctrl[0].$render = function() {
                scope.vm.value = this.$viewValue;
            }

/*        var inputPane = $element[0].querySelector('.sm-input-container');
        var calenderPane = $element[0].querySelector('.sm-calender-pane');
        var cElement = angular.element(calenderPane);
        scope.format = angular.isUndefined(scope.format) ? 'MM-DD-YYYY': scope.format;
        
        cElement.addClass('hide hide-animate');

        scope.startDate  = angular.isUndefined(scope.value)? scope.startDate : scope.value;

        $document.on('click', function (e) {
            if ((calenderPane !== e.target && inputPane !==e.target) && (!calenderPane.contains(e.target) && !inputPane.contains(e.target))) {
              hideElement();
            }
        });
        angular.element(inputPane).on('keydown', function (e) {
            if(e.which===9){
              hideElement();
            }
        });

      scope.rangeSelected = function(range){
          scope.onRangeSelect({range:range});
        }


        scope.show= function(){
          var elementRect = inputPane.getBoundingClientRect();
          var bodyRect = document.body.getBoundingClientRect();
           cElement.removeClass('hide');
          if($mdMedia('sm') ||  $mdMedia('xs')){
            calenderPane.style.left = (bodyRect.width-296)/2+'px';
            calenderPane.style.top =  (bodyRect.height-450)/2+ 'px';
          }else{
            var rect = getVisibleViewPort(elementRect,bodyRect);
            calenderPane.style.left = (rect.left) + 'px';
            calenderPane.style.top = (rect.top) + 'px';
          }

          document.body.appendChild(calenderPane);
          $mdUtil.disableScrollAround(calenderPane);
          cElement.addClass('show');

        }

        // calculate visible port to display calender
        function getVisibleViewPort(elementRect,bodyRect){
          var calenderHeight = 460;
          var calenderWidth = 296;

          var top =elementRect.top;
          if(elementRect.top +calenderHeight > bodyRect.bottom){
            top = elementRect.top - ((elementRect.top +calenderHeight) - (bodyRect.bottom -20));
          }
          var left = elementRect.left;
          if(elementRect.left +calenderWidth > bodyRect.right){
             left = elementRect.left - ((elementRect.left +calenderWidth) - (bodyRect.right -10));
          }
          return {top : top, left : left };
        }



        scope.$on('range-picker:close',function(){
          hideElement();
        });

        scope.$on('$destroy',function(){
          calenderPane.parentNode.removeChild(calenderPane);
        });

        function hideElement(){
            cElement.addClass('hide-animate');
            cElement.removeClass('show');          
            $mdUtil.enableScrolling();                                    
        }

        function destroyCalender(){
          calenderPane.parentNode.removeChild(calenderPane);
        }
*/

    }
  }
} 


var SMRangePickerCtrl = function($scope, $element, $mdUtil, $mdMedia, $document) {
    var self = this;
    self.$scope = $scope;
    self.$element = $element;    
    self.$mdUtil = $mdUtil;
    self.$mdMedia = $mdMedia;
    self.$document = $document;
    self.isCalenderOpen = false;


    self.calenderHeight = 460;
    self.calenderWidth = 296;


    //find input button and assign to variable
    self.inputPane = $element[0].querySelector('.sm-input-container');
    
    //find Calender Picker  and assign to variable    
    self.calenderPane = $element[0].querySelector('.sm-calender-pane');
    //button to start calender        
    self.button = $element[0].querySelector('.sm-picker-icon');

    self.calenderPan = angular.element(self.calenderPane);

    //check if mode is undefied set to date mode 
    self.mode = angular.isUndefined($scope.mode) ? 'date' : $scope.mode;
    // check if Pre defined format is supplied
    self.format = angular.isUndefined($scope.format) ? 'MM-DD-YYYY' : $scope.format;

    self.calenderPan.addClass('hide hide-animate');

    self.bodyClickHandler = angular.bind(self,self.clickOutSideHandler);

    self.$scope.$on('range-picker:close', function() {
      self.$document.off('keydown');
      self.hideElement();
    });

    self.$scope.$on('$destroy', function() {
      self.calenderPane.parentNode.removeChild(self.calenderPane);
    }); 

    // if tab out hide key board
    angular.element(self.inputPane).on('keydown', function(e) {
      switch(e.which){
        case  27:
        case  9:
          self.hideElement();
            break;
        }
    });

}


/*get visiable port

  @param : elementnRect 

  @param : bodyRect 

*/

SMRangePickerCtrl.prototype.getVisibleViewPort = function(elementRect, bodyRect) {
    var self = this;

    var top = elementRect.top;
    if (elementRect.top + self.calenderHeight > bodyRect.bottom) {
        top = elementRect.top - ((elementRect.top + self.calenderHeight) - (bodyRect.bottom - 20));
    }
    var left = elementRect.left;
    if (elementRect.left + self.calenderWidth > bodyRect.right) {
        left = elementRect.left - ((elementRect.left + self.calenderWidth) - (bodyRect.right - 10));
    }
    return {
        top: top,
        left: left
    };
}

SMRangePickerCtrl.prototype.rangeSelected = function(range){
  var self = this;
  self.onRangeSelect({range: range});
  self.value = range;
}


SMRangePickerCtrl.prototype.show = function($event) {
  var self = this;
  var elementRect = self.inputPane.getBoundingClientRect();
  var bodyRect = document.body.getBoundingClientRect();

  self.calenderPan.removeClass('hide hide-animate');
  
  if (self.$mdMedia('sm') || self.$mdMedia('xs')) {
    self.calenderPane.style.left = (bodyRect.width - 320) / 2 + 'px';
    self.calenderPane.style.top = (bodyRect.height - 450) / 2 + 'px';
  } else {
    var rect = self.getVisibleViewPort(elementRect, bodyRect);
    self.calenderPane.style.left = (rect.left) + 'px';
    self.calenderPane.style.top = (rect.top) + 'px';
  }

  
//   document.body.appendChild(self.calenderPane);
//   angular.element(self.calenderPane).focus();
  var myEl = angular.element( document.querySelector( '#inner-editor' ) );
  myEl.append(self.calenderPane);
  angular.element(self.calenderPane).focus();
  
  self.calenderPan.addClass('show');
  self.$mdUtil.disableScrollAround(self.calenderPane);    
  
  
  self.isCalenderOpen =true;
  self.$document.on('click',self.bodyClickHandler);
}


SMRangePickerCtrl.prototype.tabOutEvent= function(element){
  var self = this;
    if (element.which === 9) {
      self.hideElement();
    }
}

SMRangePickerCtrl.prototype.hideElement= function() {
  var self = this;
  self.calenderPan.addClass('hide-animate');
  self.calenderPan.removeClass('show');
  self.$mdUtil.enableScrolling();

  if(self.button){
    angular.element(self.button).focus();    
  }
  self.$document.off('click'); 
  self.isCalenderOpen =false;

}


SMRangePickerCtrl.prototype.clickOutSideHandler = function(e){
  var self = this;
  if(!self.button){
    if ((self.calenderPane !== e.target && self.inputPane !== e.target ) && (!self.calenderPane.contains(e.target)  && !self.inputPane.contains(e.target))) {
      self.hideElement();
    }
  }else{
    if ((self.calenderPane !== e.target && self.button !== e.target ) && (!self.calenderPane.contains(e.target)  && !self.button.contains(e.target))) {
      self.hideElement();
    }
  }
}

var app = angular.module('smDateTimeRangePicker');
app.directive('smRangePickerInput',['$document','$mdMedia','$mdUtil','picker',RangePickerInput]);

})();
function smRangePicker (picker){
  return{
    restrict : 'E',
    require : ['^?ngModel','smRangePicker'],
    scope:{
      format:'@',
      divider: '@',
      weekStartDay :"@",
      customToHome: "@",
      closeOnSelect: "@",
      mode: "@",      
      showCustom:'@',
      customList: '=',
      minDate : '@',
      maxDate : '@',
	  allowClear: '@',
	  allowEmpty: '@',
      rangeSelectCall : '&'
    },
    terminal:true,
    controller: ['$scope','picker',RangePickerCtrl],
    controllerAs : 'vm',
    bindToController:true,
    templateUrl : 'picker/range-picker.html',
    link : function(scope,element,att,ctrls){
      var ngModelCtrl = ctrls[0];
      var calCtrl = ctrls[1];
      calCtrl.configureNgModel(ngModelCtrl);
    }    
  }
}

var RangePickerCtrl = function($scope,picker){
  var self = this;
  self.scope = $scope;
  self.clickedButton = 0;
  self.startShowCustomSettting =self.showCustom;


  self.startDate = moment();
  self.endDate = moment();

  self.divider = angular.isUndefined(self.scope.divider) || self.scope.divider ===''? picker.rangeDivider : $scope.divider;

	//display the clear button?
	self.showClearButton = self.allowClear === 'true' || false;
	//allow set start/end date as empty value
	self.allowEmptyDates = self.allowEmpty === 'true' || false;

  self.okLabel = picker.okLabel;
  self.cancelLabel = picker.cancelLabel;
  self.clearLabel = picker.clearLabel;
  self.view = 'DATE';

  self.rangeCustomStartEnd = picker.rangeCustomStartEnd;
  var defaultList = [];
  angular.copy(picker.rangeDefaultList,defaultList);
  self.rangeDefaultList =  defaultList;
  if(self.customList){
    for (var i = 0; i < self.customList.length; i++) {
      self.rangeDefaultList[self.customList[i].position] = self.customList[i];
    }
  }

  if(self.showCustom){
    self.selectedTabIndex=0;    
  }else{
    self.selectedTabIndex = $scope.selectedTabIndex;
  }

}

RangePickerCtrl.prototype.configureNgModel = function(ngModelCtrl) {
    this.ngModelCtrl = ngModelCtrl;
    var self = this;
    ngModelCtrl.$render = function() {
      self.ngModelCtrl.$viewValue= self.startDate+' '+ self.divider +' '+self.endDate;
    };
};

RangePickerCtrl.prototype.setNextView = function(){
  switch (this.mode){
    case  'date':
        this.view = 'DATE';             
        if(this.selectedTabIndex ===0 ){
          this.selectedTabIndex =1 
        }
      break;
    case  'date-time':
      if(this.view === 'DATE'){
        this.view = 'TIME';
      }else{
        this.view = 'DATE';
        if(this.selectedTabIndex ===0 ){
          this.selectedTabIndex =1 
        }
      }
      break;
    default:
        this.view = 'DATE';
        if(this.selectedTabIndex ===0 ){
          this.selectedTabIndex =1 
        }        
  }    
} 

RangePickerCtrl.prototype.showCustomView = function(){
  this.showCustom=true;
  this.selectedTabIndex=0

}

RangePickerCtrl.prototype.dateRangeSelected = function(){
    var self = this;
    self.selectedTabIndex =0;
    self.view= 'DATE';
    if(self.startShowCustomSettting){
      self.showCustom=true;
    }else{
      self.showCustom=false;
    }
    self.setNgModelValue(self.startDate,self.divider,self.endDate);
}

/* sets an empty value on dates. */
RangePickerCtrl.prototype.clearDateRange = function(){
	var self = this;
	self.selectedTabIndex =0;
	self.view= 'DATE';
	if(self.startShowCustomSettting){
		self.showCustom=true;
	}else{
		self.showCustom=false;
	}
	self.setNgModelValue('',self.divider,'');
}


RangePickerCtrl.prototype.startDateSelected = function(date){
  this.startDate = date;
  this.scope.$emit('range-picker:startDateSelected');
  this.setNextView();
}

RangePickerCtrl.prototype.startTimeSelected = function(time){

  this.startDate.hour(time.hour()).minute(time.minute());
  this.scope.$emit('range-picker:startTimeSelected');
  this.setNextView();
}


RangePickerCtrl.prototype.endDateSelected = function(date){
  this.endDate = date;
  this.scope.$emit('range-picker:endDateSelected');
  if(this.closeOnSelect && this.mode==='date'){
    this.setNgModelValue(this.startDate,this.divider,this.endDate);
  }else{
    this.setNextView();
  }
}

RangePickerCtrl.prototype.endTimeSelected = function(time){
  this.endDate.hour(time.hour()).minute(time.minute());
  this.scope.$emit('range-picker:endTimeSelected');  
  if(this.closeOnSelect && this.mode==='date-time'){
    this.setNgModelValue(this.startDate,this.divider,this.endDate);    
  }
}


RangePickerCtrl.prototype.setNgModelValue = function(startDate,divider,endDate) {
    var self = this;

	if(startDate)
	{
		startDate = startDate.format(self.format) || '';
	}

	if(endDate)
	{
		endDate = endDate.format(self.format) || '';
	}

	var range = {startDate: startDate, endDate: endDate};
    self.rangeSelectCall({range: range});
	var _ng_model_value;

	//if no startDate && endDate, then empty the model.
	if(!startDate && !endDate)
	{
		_ng_model_value = '';
	}else
	{
		startDate = startDate || 'Any';
		endDate = endDate || 'Any';
		_ng_model_value = startDate + ' ' + divider + ' ' + endDate;
	}

	setTimeout(function()
	{
		self.ngModelCtrl.$setViewValue(_ng_model_value);
		self.ngModelCtrl.$render();
	}, 50);
    self.selectedTabIndex = 0;
    self.view ="DATE";
    self.scope.$emit('range-picker:close');    
};

RangePickerCtrl.prototype.cancel = function(){
  var self = this;
  if(self.customToHome && self.showCustom){
    self.showCustom=false; 
  }else{
    self.selectedTabIndex =0;
    self.showCustom=false; 
    self.scope.$emit('range-picker:close');        
  }
}

var app = angular.module('smDateTimeRangePicker');
app.directive('smRangePicker',['picker',smRangePicker]);
function smTimePickerNew($mdUtil,$mdMedia,$document,$timeout,picker){
    return {
      restrict : 'E',
      replace:true,
      scope :{
        value: '=',
        startDate : '@',
        weekStartDay : '@',
        startView:"@",                  
        mode : '@',
        format : '@',
        minDate : '@',
        maxDate : '@',
        fname : "@",
        lable : "@",
        isRequired : '@',
        disable : '=',
        form : '=',
	    closeOnSelect:"@"
      },
      template: '  <md-input-container >'
                +'    <label for="{{fname}}">{{lable }}</label>'
                +'    <input name="{{fname}}" ng-model="value" ng-readonly="true"'
                +'             type="text" placeholde="{{lable}}"'
                +'             aria-label="{{fname}}" data-ng-required="isRequired"'
                +'             ng-focus="show()" server-error class="sm-input-container">'
                +'    <div ng-messages="form.fname.$error" ng-if="form[fname].$touched">'
                +'    		<div ng-messages-include="{{ngMassagedTempaltePath}}"></div>'
                +'    </div>'
                +'    <div id="picker" class="sm-calender-pane md-whiteframe-15dp">'
                +'     		<sm-time-picker '
                +'              id="{{fname}}Picker" '  
                +'              ng-model="value" '
                +'				initial-date="{{value}}"'
                +'              mode="{{mode}}" '
                +'				close-on-select="{{closeOnSelect}}"'
                +'              start-view="{{startView}}" '  
                +'              data-min-date="minDate" '
                +'              data-max-date="maxDate"  '
                +'              format="{{format}}"  '
                +'          	start-day="{{weekStartDay}}" > '
                +'			</sm-time-picker>'
                +'    </div>'                
                +'  </md-input-container>',
      link :  function(scope,$element,attr){
        var inputPane = $element[0].querySelector('.sm-input-container');
        var calenderPane = $element[0].querySelector('.sm-calender-pane');
        var cElement = angular.element(calenderPane);
        scope.ngMassagedTempaltePath =picker.massagePath;
        // check if Pre defined format is supplied
        scope.format = angular.isUndefined(scope.format) ? 'MM-DD-YYYY': scope.format;

        
        // Hide calender pane on initialization
        cElement.addClass('hide hide-animate');

        // set start date
        scope.startDate  = angular.isUndefined(scope.value)? scope.startDate : scope.value;

        // Hide Calender on click out side
        $document.on('click', function (e) {
            if ((calenderPane !== e.target && inputPane !==e.target) && (!calenderPane.contains(e.target) && !inputPane.contains(e.target))) {
        		hideElement();
            }
        });

        // if tab out hide key board
        angular.element(inputPane).on('keydown', function (e) {
            if(e.which===9){
        		hideElement();
            }
        });

        // show calender 
        scope.show= function(){
          var elementRect = inputPane.getBoundingClientRect();
          var bodyRect = document.body.getBoundingClientRect();

          cElement.removeClass('hide');
          if($mdMedia('sm') ||  $mdMedia('xs')){
            calenderPane.style.left = (bodyRect.width-300)/2+'px';
            calenderPane.style.top = 'initial';
          }else{
            var rect = getVisibleViewPort(elementRect,bodyRect);
            calenderPane.style.left = (rect.left) + 'px';
            calenderPane.style.top = 'initial';
          }
        //   document.body.appendChild(calenderPane);
		  var myEl = angular.element( document.querySelector( '#inner-editor' ) );
  		  myEl.append(calenderPane);
  		  angular.element(calenderPane).focus();

          $mdUtil.disableScrollAround(calenderPane);
          cElement.addClass('show');
        }

        // calculate visible port to display calender
        function getVisibleViewPort(elementRect,bodyRect){
          var calenderHeight = 460;
          var calenderWidth = 296;

          var top = 'initial';
        //   if(elementRect.top +calenderHeight > bodyRect.bottom){
        //     top = elementRect.top - ((elementRect.top +calenderHeight) - (bodyRect.bottom -20));
        //   }
          var left = elementRect.left;
          if(elementRect.left +calenderWidth > bodyRect.right){
             left = elementRect.left - ((elementRect.left +calenderWidth) - (bodyRect.right -10));
          }
          return {top : top, left : left };
        }

        function hideElement(){
			     cElement.addClass('hide-animate');
        	cElement.removeClass('show');
          	 //this is only for animation
            //calenderPane.parentNode.removeChild(calenderPane);          
            $mdUtil.enableScrolling();
        }

        scope.$on('$destroy',function(){
          calenderPane.parentNode.removeChild(calenderPane);
        });
                
        //listen to emit for closing calender
        scope.$on('calender:close',function(){
        	hideElement();
        });
    }
  }
} 

var app = angular.module('smDateTimeRangePicker');
app.directive('smTimePickerNew',['$mdUtil','$mdMedia','$document','$timeout','picker',smTimePickerNew]);

angular.module("smDateTimeRangePicker").run(["$templateCache", function($templateCache) {$templateCache.put("picker/calender-date.html","<div class=\"date-picker\">\r\n    <div ng-class=\"{\'year-container\' : vm.view===\'YEAR_MONTH\'}\" ng-show=\"vm.view===\'YEAR_MONTH\'\">\r\n        <md-virtual-repeat-container class=\"year-md-repeat\" id=\"year-container\" md-top-index=\"vm.yearTopIndex\">\r\n            <div class=\"repeated-item\" md-on-demand=\"\" md-virtual-repeat=\"yr in vm.yearItems\">\r\n                    <div class=\"year\" ng-class=\"{\'md-accent\': yr === vm.currentDate.year(), \'selected-year md-primary\':vm.initialDate.year()===yr}\">\r\n                         <span class=\"year-num\" ng-click=\"vm.changeYear(yr,vm.currentDate.month())\">{{yr}}</span>                   \r\n                    </div>\r\n                    <div class=\"month-row\" >\r\n                        <span ng-click=\"vm.changeYear(yr + 1,0)\" class=\"month\">{{vm.monthList[0]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,1)\" class=\"month\">{{vm.monthList[1]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,2)\" class=\"month\">{{vm.monthList[2]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,3)\" class=\"month\">{{vm.monthList[3]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,4)\" class=\"month\">{{vm.monthList[4]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,5)\" class=\"month\">{{vm.monthList[5]}}</span>\r\n                    </div>\r\n                    <div  class=\"month-row\">\r\n                        <span ng-click=\"vm.changeYear(yr + 1,6)\" class=\"month\">{{vm.monthList[6]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,7)\" class=\"month\">{{vm.monthList[7]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,8)\" class=\"month\">{{vm.monthList[8]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,9)\" class=\"month\">{{vm.monthList[9]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,10)\" class=\"month\">{{vm.monthList[10]}}</span>\r\n                        <span ng-click=\"vm.changeYear(yr + 1,11)\" class=\"month\">{{vm.monthList[11]}}</span>\r\n                    </div>\r\n                    <md-divider></md-divider>\r\n            </div>\r\n\r\n        </md-virtual-repeat-container>\r\n    </div>\r\n    <div ng-class=\"{\'date-container\' : vm.view===\'DATE\'}\" ng-show=\"vm.view===\'DATE\'\">\r\n        <div class=\"navigation\" layout=\"row\" layout-align=\"space-between center\">\r\n           <md-button aria-label=\"previous\"  md-no-ink=\"true\"   class=\"md-icon-button scroll-button\" ng-click=\"vm.changePeriod(\'p\')\" ng-disabled=\"vm.stopScrollPrevious\">\r\n                <svg height=\"18\" viewbox=\"0 0 18 18\" width=\"18\" xmlns=\"http://www.w3.org/2000/svg\">\r\n                    <path d=\"M15 8.25H5.87l4.19-4.19L9 3 3 9l6 6 1.06-1.06-4.19-4.19H15v-1.5z\">\r\n                    </path>\r\n                </svg>\r\n            </md-button>\r\n            <md-button aria-label=\"Change Year\" class=\"md-button\" md-no-ink=\"\" ng-class=\"vm.moveCalenderAnimation\" ng-click=\"vm.changeView(\'YEAR_MONTH\')\">\r\n                {{vm.monthList[vm.initialDate.month()]}}{{\' \'}}{{vm.initialDate.year()}}\r\n            </md-button>\r\n          <md-button aria-label=\"next\"  md-no-ink=\"true\"  class=\"md-icon-button scroll-button\" ng-click=\"vm.changePeriod(\'n\')\" ng-disabled=\"vm.stopScrollNext\">\r\n                <svg height=\"18\" viewbox=\"0 0 18 18\" width=\"18\" xmlns=\"http://www.w3.org/2000/svg\">\r\n                    <path d=\"M9 3L7.94 4.06l4.19 4.19H3v1.5h9.13l-4.19 4.19L9 15l6-6z\">\r\n                    </path>\r\n                </svg>\r\n            </md-button>\r\n        </div>\r\n        <div class=\"date-cell-header\">\r\n            <md-button class=\"md-icon-button\" md-autofocus=\"\" ng-disabled=\"true\" ng-repeat=\"dHead in vm.dateCellHeader\">\r\n                {{dHead[vm.dayHeader]}}\r\n            </md-button>\r\n        </div>\r\n        <div class=\"date-cell-row\" md-swipe-left=\"vm.changePeriod(\'n\')\" md-swipe-right=\"vm.changePeriod(\'p\')\" ng-class=\"vm.moveCalenderAnimation\">\r\n            <div layout=\"row\" ng-repeat=\"w in vm.dateCells\">\r\n                <md-button aria-label=\"vm.currentDate\" class=\"date-cell md-icon-button\" ng-class=\"{\'md-primary sm-today\' : d.today,\r\n								\'active\':d.isCurrentMonth,\r\n								\'md-primary md-raised selected\' : d.dayNum == vm.currentDate.date(),\r\n								\'disabled\':d.isDisabledDate}\" ng-click=\"vm.selectDate(d.date,d.isDisabledDate)\" ng-disabled=\"d.isDisabledDate\" ng-repeat=\"d in w\">\r\n                    <span>\r\n                        {{d.dayNum}}\r\n                    </span>\r\n                </md-button>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n");
$templateCache.put("picker/calender-hour.html","<div  class=\"time-picker\" layout=\"row\" layout-align=\"center center\">\r\n	<div>\r\n		<div layout=\"row\" class=\"navigation\">\r\n			<span class=\"md-button\">Hour</span>\r\n			<span class=\"md-button\">Minute</span>\r\n		</div>\r\n		<div layout=\"row\" >\r\n			<md-virtual-repeat-container flex=\"50\"  id=\"hour-container{{vm.uid}}\" class=\"time-md-repeat\" md-top-index=\"vm.hourTopIndex\">\r\n			<div ng-repeat=\"h in vm.hourItems\" class=\"repeated-item\">\r\n						<md-button class=\"md-icon-button\" \r\n							ng-click=\"vm.setHour(h.hour)\" 							\r\n							ng-class=\"{\'md-primary\': false,\r\n									\'md-primary md-raised\' :h.highlighter===vm.currentDate.hour()}\">\r\n							{{h.hour}}\r\n						</md-button>\r\n			</div>\r\n			</md-virtual-repeat-container>		     \r\n			<md-virtual-repeat-container flex=\"50\" id=\"minute-container\" class=\"time-md-repeat\" md-top-index=\"vm.minuteTopIndex\">\r\n				<div ng-repeat=\"m in vm.minuteCells\"  class=\"repeated-item\">\r\n						<md-button class=\"md-icon-button\" \r\n							ng-click=\"vm.setMinute(m.minute)\" 							\r\n							ng-class=\"{\'md-primary\': false,\r\n								\'md-primary md-raised\' : m.minute === vm.currentDate.minute()}\">\r\n							{{m.minute}}\r\n						</md-button>\r\n				</div>\r\n			</md-virtual-repeat-container>		     \r\n		</div>	\r\n	</div>\r\n</div>");
$templateCache.put("picker/date-picker-service.html","<md-dialog class=\"picker-container  md-whiteframe-15dp\" aria-label=\"picker\">\r\n	<md-content  layout-xs=\"column\" layout=\"row\"  class=\"container\" >\r\n		<md-toolbar class=\"md-height\" ng-class=\"{\'portrait\': !vm.$mdMedia(\'gt-xs\'),\'landscape\': vm.$mdMedia(\'gt-xs\')}\" >			\r\n				<span class=\"year-header\" layout=\"row\" layout-xs=\"row\">{{vm.viewDate.format(\'YYYY\')}}</span>\r\n				<span class=\"date-time-header\" layout=\"row\" layout-xs=\"row\">{{vm.viewDate.format(vm.headerDispalyFormat)}}</span>\r\n		</md-toolbar>\r\n		<div layout=\"column\" class=\"picker-container\" >\r\n			<div ng-show=\"vm.view===\'DATE\'\" >\r\n				<sm-calender \r\n					ng-model=\"vm.selectedDate\"\r\n					initial-date=\"vm.selectedDate\"\r\n					id=\"{{vm.fname}}Picker\" \r\n					data-mode=\"{{vm.mode}}\" \r\n					data-min-date=\"vm.minDate\" \r\n					data-max-date=\"vm.maxDate\" \r\n					close-on-select=\"{{vm.closeOnSelect}}\"				 \r\n					data-format=\"{{vm.format}}\"  \r\n					data-week-start-day=\"{{vm.weekStartDay}}\"\r\n					date-select-call=\"vm.dateSelected(date)\">\r\n				</sm-calender>\r\n			</div>\r\n			<div ng-show=\"vm.view===\'HOUR\'\">\r\n				<sm-time\r\n					ng-model=\"vm.selectedTime\"\r\n					data-format=\"HH:mm\"\r\n					time-select-call=\"vm.timeSelected(time)\">\r\n				</sm-time>\r\n			</div>		\r\n 			<div layout=\"row\" ng-hide=\"vm.closeOnSelect && (vm.mode!==\'date-time\' || vm.mode!==\'time\')\">\r\n<!-- 					<div ng-show=\"vm.mode===\'date-time\'\">\r\n						<md-button class=\"md-icon-button\" ng-show=\"vm.view===\'DATE\'\" ng-click=\"vm.view=\'HOUR\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">access_time</md-icon>\r\n						</md-button>				\r\n						<md-button class=\"md-icon-button\" ng-show=\"vm.view===\'HOUR\'\" ng-click=\"vm.view=\'DATE\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">date_range</md-icon>\r\n						</md-button>\r\n					</div>												\r\n -->					<span flex></span>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"vm.closeDateTime()\">{{vm.cancelLabel}}</md-button>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"vm.selectedDateTime()\">{{vm.okLabel}}</md-button>\r\n			</div>\r\n		</div>\r\n	</md-content>	\r\n</md-dialog>");
$templateCache.put("picker/date-picker.html","<div class=\"picker-container\">\r\n	<md-content  layout-xs=\"column\" layout=\"row\"  class=\"container\" >\r\n		<md-toolbar class=\"md-height\" ng-class=\"{\'portrait\': !vm.$mdMedia(\'gt-xs\'),\'landscape\': vm.$mdMedia(\'gt-xs\')}\" >			\r\n				<span class=\"year-header\" layout=\"row\" layout-xs=\"row\">{{vm.currentDate.format(\'YYYY\')}}</span>\r\n				<span class=\"date-time-header\" layout=\"row\" layout-xs=\"row\">{{vm.currentDate.format(vm.headerDispalyFormat)}}</span>\r\n		</md-toolbar>\r\n		<div layout=\"column\" class=\"picker-container\" >\r\n			<div ng-show=\"vm.view===\'DATE\'\" >\r\n				<sm-calender \r\n					data-ng-model=\"vm.selectedDate\"\r\n					data-initial-date=\"vm.initialDate\"					\r\n					data-id=\"{{vm.fname}}Picker\" \r\n					data-mode=\"{{vm.mode}}\" \r\n					data-min-date=\"vm.minDate\" \r\n					data-max-date=\"vm.maxDate\" \r\n					data-close-on-select=\"{{vm.closeOnSelect}}\"				 \r\n					data-data-format=\"{{vm.format}}\" \r\n					data-disable-year-selection=\"{{vm.disableYearSelection}}\" \r\n					data-week-start-day=\"{{vm.weekStartDay}}\"\r\n					data-date-select-call=\"vm.dateSelected(date)\">\r\n				</sm-calender>\r\n			</div>\r\n			<div ng-show=\"vm.view===\'TIME\'\">\r\n				<sm-time\r\n					data-ng-model=\"vm.selectedTime\"\r\n					data-format=\"HH:mm\"\r\n					data-time-select-call=\"vm.timeSelected(time)\">\r\n				</sm-time>\r\n			</div>		\r\n			<div layout=\"row\" ng-hide=\"vm.closeOnSelect\">\r\n					<span flex></span>\r\n							<md-button class=\"md-button md-primary\" ng-click=\"vm.closeDateTime()\">{{vm.cancelLabel}}</md-button>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"vm.selectedDateTime()\">{{vm.okLabel}}</md-button>\r\n			</div>\r\n		</div>\r\n	</md-content>	\r\n</div>");
$templateCache.put("picker/range-picker.html","<md-content layout=\"column\"  id=\"{{id}}\" class=\"range-picker md-whiteframe-2dp\" >\r\n    <md-toolbar layout=\"row\"  class=\"md-primary\" >\r\n      	<div class=\"md-toolbar-tools\"  layout-align=\"space-around center\">\r\n			<div  class=\"date-display\"><span>{{vm.startDate.format(vm.format)}}</span></div>\r\n			<div   class=\"date-display\"><span>{{vm.endDate.format(vm.format)}}</span></div>\r\n		</div>\r\n	</md-toolbar>\r\n	<div  layout=\"column\" class=\"pre-select\"  role=\"button\" ng-show=\"!vm.showCustom\">\r\n		<md-button\r\n			 aria-label=\"{{list.label}}\" \r\n			 ng-click=\"vm.setNgModelValue(list.startDate,vm.divider,list.endDate)\" \r\n			 ng-repeat=\"list in vm.rangeDefaultList | limitTo:6\">{{list.label}}\r\n		 </md-button> \r\n		<md-button aria-label=\"Custom Range\"  ng-click=\"vm.showCustomView()\">Custom Range</md-button>			\r\n	</div>\r\n	<div layout=\"column\" class=\"custom-select\" ng-show=\"vm.showCustom\" ng-class=\"{\'show-calender\': vm.showCustom}\">\r\n		<div layout=\"row\"   class=\"tab-head\">\r\n			<span  ng-class=\"{\'active moveLeft\':vm.selectedTabIndex===0}\">{{vm.rangeCustomStartEnd[0]}}</span>\r\n			<span  ng-class=\"{\'active moveLeft\':vm.selectedTabIndex===1}\">{{vm.rangeCustomStartEnd[1]}}</span>			\r\n		</div>\r\n		<div ng-show=\"vm.selectedTabIndex===0\" ng-model=\"vm.startDate\" >\r\n			<div layout=\"row\" ng-if=\"vm.allowEmptyDates\" ng-click=\"vm.startDateSelected(\'\')\">\r\n				<md-button class=\"md-warn\"><small>No start date</small></md-button>\r\n			</div>\r\n			<sm-calender \r\n				ng-show=\"vm.view===\'DATE\'\"\r\n				week-start-day=\"{{weekStartDay}}\"\r\n				min-date=\"vm.minDate\"\r\n				max-date=\"vm.maxDate\"\r\n				format=\"{{format}}\"\r\n				date-select-call=\"vm.startDateSelected(date)\">\r\n			</sm-calender>\r\n			<sm-time\r\n				ng-show=\"vm.view===\'TIME\'\"\r\n				ng-model=\"selectedStartTime\"\r\n				time-select-call=\"vm.startTimeSelected(time)\">\r\n			</sm-time>\r\n		</div>\r\n		<div ng-if=\"vm.selectedTabIndex===1\" ng-model=\"vm.endDate\" >\r\n			<div layout=\"row\" layout-align=\"end\" ng-if=\"vm.allowEmptyDates\" ng-click=\"vm.endDateSelected(\'\')\">\r\n				<md-button class=\"md-warn\"><small>No end date</small></md-button>\r\n			</div>\r\n			<sm-calender \r\n				format=\"{{format}}\"\r\n				ng-show=\"vm.view===\'DATE\'\"\r\n				initial-date=\"vm.startDate.format(format)\"\r\n				min-date=\"vm.startDate\"\r\n				max-date=\"vm.maxDate\"\r\n				week-start-day=\"{{weekStartDay}}\"\r\n				date-select-call=\"vm.endDateSelected(date)\">\r\n			</sm-calender>\r\n			<sm-time\r\n				ng-show=\"vm.view===\'TIME\'\"\r\n				ng-model=\"selectedEndTime\"\r\n				time-select-call=\"vm.endTimeSelected(time)\">\r\n			</sm-time>\r\n		</div>								\r\n	</div>\r\n	<div layout=\"row\" layout-align=\"end center\">\r\n		<md-button type=\"button\" class=\"md-warn\" ng-if=\"vm.showClearButton\" ng-click=\"vm.clearDateRange()\">{{vm.clearLabel}}</md-button>\r\n		<span flex></span>\r\n		<md-button type=\"button\" class=\"md-primary\" ng-click=\"vm.cancel()\">{{vm.cancelLabel}}</md-button>\r\n		<md-button type=\"button\" class=\"md-primary\" ng-click=\"vm.dateRangeSelected()\">{{vm.okLabel}}</md-button>\r\n	</div>	\r\n</md-content>");
$templateCache.put("picker/time-picker.html","<div class=\"picker-container  md-whiteframe-15dp\">\r\n	<md-content  layout-xs=\"column\" layout=\"row\"  class=\"container\" >\r\n		<md-toolbar class=\"md-height\" ng-class=\"{\'portrait\': !$mdMedia(\'gt-xs\'),\'landscape\': $mdMedia(\'gt-xs\')}\" >			\r\n				<span class=\"year-header\" layout=\"row\" layout-xs=\"row\">{{currentDate.format(\'YYYY\')}}</span>\r\n				<span class=\"date-time-header\" layout=\"row\" layout-xs=\"row\">{{currentDate.format(headerDispalyFormat)}}</span>\r\n		</md-toolbar>\r\n		<div layout=\"column\" class=\"picker-container\" >\r\n			<sm-time\r\n				ng-model=\"selectedTime\"\r\n				data-format=\"HH:mm\">\r\n			</sm-time>\r\n			<div layout=\"row\" ng-hide=\"closeOnSelect && (mode!==\'date-time\' || mode!==\'time\')\">\r\n					<div ng-show=\"mode===\'date-time\'\">\r\n						<md-button class=\"md-icon-button\" ng-show=\"view===\'DATE\'\" ng-click=\"view=\'HOUR\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">access_time</md-icon>\r\n						</md-button>				\r\n						<md-button class=\"md-icon-button\" ng-show=\"view===\'HOUR\'\" ng-click=\"view=\'DATE\'\">\r\n							<md-icon md-font-icon=\"material-icons md-primary\">date_range</md-icon>\r\n						</md-button>\r\n					</div>												\r\n					<span flex></span>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"closeDateTime()\">{{cancelLabel}}</md-button>\r\n					<md-button class=\"md-button md-primary\" ng-click=\"selectedDateTime()\">{{okLabel}}</md-button>\r\n			</div>\r\n		</div>\r\n	</md-content>	\r\n</div>");}]);
