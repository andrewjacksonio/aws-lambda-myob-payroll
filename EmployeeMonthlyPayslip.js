/*
 *      Title:  MYOB Coding Exercise!
 *      Coder:  Andrew Jackson
 *      Date:   12 December 2015
 */

console.log('Loading function');

exports.handler = function(event, context) {
    
    //extend Date to return month names
    Date.prototype.monthNames = ["January"
                                ,"February"
                                ,"March"
                                ,"April"
                                ,"May"
                                ,"June"
                                ,"July"
                                ,"August"
                                ,"September"
                                ,"October"
                                ,"November"
                                ,"December"];
    
    Date.prototype.getMonthName = function() {
        return this.monthNames[this.getMonth()];
    };
	    
    //log exact inputs
    console.log("event.firstName: " + event.firstName);
    console.log("event.lastName: " + event.lastName);
    console.log("event.annualSalary: " + event.annualSalary);
    console.log("event.superRate: " + event.superRate);
    console.log("event.paymentPeriod: " + event.paymentPeriod);
    
    //validate inputs
    var annualSalary = event.annualSalary;
    if (annualSalary < 0) { context.fail("Annual salary must be a positive number."); }
    
    var superRate = event.superRate / 100; 
    if (superRate < 0 || superRate > 0.5) { context.fail("Super rate must be between 0-50%."); }

    //parse the payment period dates to date format
    var dateDelim = " - ";
    var arrayPaymentPeriod = event.paymentPeriod.split(dateDelim);
    var periodStartDate = parsePayslipDate(arrayPaymentPeriod[0]);
    var periodEndDate = parsePayslipDate(arrayPaymentPeriod[1]);
    
    //simple date validation
    if (periodStartDate>periodEndDate) { context.fail("Payment period start date after end date."); }

    var payPeriodIncomeGross = 0;
    var payPeriodIncomeTax = 0;
    var payPeriodIncomeNet = 0;
    var payPeriodSuper = 0;
    
    var annualTax = calcAnnualTax(annualSalary);
    
    //if not monthly pay then use days to calculate payslip
    var divider = 12;
    if (!isMonthlyPay(periodStartDate, periodEndDate)) {
        var nextYear = new Date(periodStartDate).setYear(periodStartDate.getFullYear()+1);
        var daysInYear = Math.round((nextYear-periodStartDate) / (1000*60*60*24));
        var daysInPeriod = Math.round((periodEndDate-periodStartDate) / (1000*60*60*24)) + 1;   //add 1 because last day of period is inclusive
        divider = daysInYear / daysInPeriod;
    }

    payPeriodIncomeGross = annualSalary / divider;
    payPeriodIncomeTax = annualTax / divider;
    payPeriodIncomeNet = (annualSalary - annualTax) / divider;
    payPeriodSuper = annualSalary * superRate / divider;
    
    //build comma deliminated result line
    var csvLine = outputBuilder(event.firstName + ' ' + event.lastName
                                ,zeroPad(periodStartDate.getDate(),2) + ' ' + periodStartDate.getMonthName() + dateDelim + zeroPad(periodEndDate.getDate(),2) + ' ' + periodEndDate.getMonthName()
                                ,Math.round(payPeriodIncomeGross)
                                ,Math.round(payPeriodIncomeTax)
                                ,Math.round(payPeriodIncomeNet)
                                ,Math.round(payPeriodSuper));
                                
    context.succeed(csvLine);   //output single line

    //accurate for 2012-2015 Australian financial years
    function calcAnnualTax(annualSalary) {
        if (annualSalary < 18201) {             //0 - $18,200           Nil
            return 0;
        }
        else if (annualSalary < 37001) {        //$18,201 - $37,000     19c for each $1 over $18,200
            return annualSalary - 18200 * 0.19;
        } 
        else if(annualSalary < 80001) {         //$37,001 - $80,000     $3,572 plus 32.5c for each $1 over $37,000
            return (annualSalary - 37000) * 0.325 + 3572;
        } 
        else if(annualSalary < 180001) {        //$80,001 - $180,000    $17,547 plus 37c for each $1 over $80,000
            return (annualSalary - 80000) * 0.37 + 17547;
        } 
        else  {                                 //$180,001 and over     $54,547 plus 45c for each $1 over $180,000 
            return (annualSalary - 180000) * 0.45 + 54547;
        } 
    }
    
    //determine if payment period is exactly 1 month for monthly payment period calculation
    function isMonthlyPay(periodStartDate, periodEndDate) {
        var date1 = new Date(periodStartDate).setMonth(periodStartDate.getMonth()+1);
        var date2 = new Date(periodEndDate).setDate(periodEndDate.getDate()+1);
        var isMonthly = false; 
        if (date1 === date2) {
            isMonthly = true;
        }
        
        return isMonthly;
    }

    //handles different date formats
    function parsePayslipDate(payslipDate) {
        var strDate = payslipDate.split(" ", 3);
        var newDate = new Date();
        newDate.setMilliseconds(0);
        newDate.setSeconds(0);
        newDate.setMinutes(0);
        newDate.setHours(0);
        
        if (strDate.length > 0) {
            newDate.setDate(strDate[0]);
        }
        if (strDate.length > 1) {
            if (isNaN(strDate[1])) {
                newDate.setMonth("janfebmaraprmayjunjulaugsepoctnovdec".indexOf(strDate[1].substring(0,3).toLowerCase()) / 3);
            } else {
                newDate.setMonth(strDate[1]-1);
            }
        }
        if (strDate.length > 2) {
            newDate.setYear(strDate[2]);
        }
        
        return newDate;
    }
    
    function outputBuilder(name,paymentPeriod,payPeriodIncomeGross,payPeriodIncomeTax,payPeriodIncomeNet,payPeriodSuper) {
        var outputLine = "";
        
        outputLine += name;
        outputLine += ',' + paymentPeriod;
        outputLine += ',' + payPeriodIncomeGross;
        outputLine += ',' + payPeriodIncomeTax;
        outputLine += ',' + payPeriodIncomeNet;
        outputLine += ',' + payPeriodSuper;
        
        return outputLine;
    }
    
    //format single digit dates as per sample output
    function zeroPad(num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    }
};