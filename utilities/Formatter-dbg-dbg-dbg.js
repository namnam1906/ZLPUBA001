sap.ui.define([
	"./Formatter"
], function() {
	"use strict";

	return {
		formatterResultCreateAp: function (pResultText, pHoldDocNo) {
			return pResultText.format(pHoldDocNo);
		},
		dateFormatterGW: function (date) {
			var oFormatter = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyy-MM-dd"
			});
			if (date) {
				return "datetime'" + oFormatter.format(date) + encodeURIComponent("T00:00:00")+"'";
			}
			else{
				return "";
			}
		},
		parseInt: function(pValue){
			var oValue = 0;
			if(parseInt(pValue)){
				oValue = parseInt(pValue);
			}
			return oValue;
		},
		parseStatus: function(pStatus){
			var oStatus = "None";
			
			switch (pStatus) {
				case "INP":
					oStatus = "Warning";
					break;
				case "APP":
					oStatus = "Success";
					break;
				case "DEL":
					oStatus = "Error";
					break;
				case "HOL":
					oStatus = "None";
					break;
				default:
			}
			
			return oStatus;
		},
		
		parseCurrency: function(pCurrency){
			var oCurrency = "�ҷ";
			
			switch (pCurrency) {
				case "THB":
					oCurrency = "�ҷ";
					break;
				case "USD":
					oCurrency = "�������";
					break;
				case "EUR":
					oCurrency = "����";
					break;
				default:
			}
			
			return oCurrency;
		},
		
		parseStatusText: function(pStatus){
			var oStatus = "��辺���͹�";
			
			switch (pStatus) {
				case "INP":
					oStatus = "��͹��ѵ�";
					break;
				case "APP":
					oStatus = "͹��ѵ�����";
					break;
				case "DEL":
					oStatus = "ź�ء��¡��";
					break;
				case "HOL":
					oStatus = "�ЧѺ";
					break;
				default:
			}
			
			return oStatus;
		},
		
		parseCodeName: function(pCode,pName){
			
			var text;
			if(pCode && pCode !== '0'){
				text = pName + " (" + pCode + ")";
			}else{
				text = pName;
			}
			
			return text;
		},
		
		parseEgp: function(egpNo,egpItem){
			
			var text;
			// if(egpNo && egpItem){
			// 	text = egpNo + " / " + parseInt(egpItem,0);
			// }else{
			// 	text = "-";
			// }
			text = egpNo + " / " + egpItem;
			
			return text;
		},
		
		parseCodeNameItemCat: function(pCode,pName){
			
			var text;
			
			if(pCode === '9'){
				pCode = 'D';
			}
			
			if(pCode && pCode !== '0'){
				text = pName + " (" + pCode + ")";
			}else{
				text = pName;
			}
			
			return text;
		},
		
		parseCodeNameKnttp: function(pCode,pName){
			
			var text;
			if(pCode && pCode !== '0'){
				text = pName + " (" + pCode + ")";
			}else{
				text = pName;
			}
			
			if(pCode === "" || pCode === "-"){
				text = "��ʴؤ���ѧ (ʵ�͡)";
			}
			
			return text;
		},
		
		parseCodeNameKnttpItemCat: function(pCode,pName, pCode2, pName2){
			
			var text, text2;
			if(pCode && pCode !== '0'){
				text = pName + " (" + pCode + ")";
			}else{
				text = pName;
			}
			
			if(pCode === "" || pCode === "-"){
				text = "��ʴؤ���ѧ (ʵ�͡)";
			}
			
			if(pCode2 === '9'){
				pCode2 = 'D';
			}
			
			if(pCode2 && pCode2 !== '0'){
				text2 = pName2 + " (" + pCode2 + ")";
			}else{
				text2 = pName2;
			}
			
			return text + " / " + text2;
		},
		
		parseDocWithDocItem: function(pDoc,pDocItem){
			return pDoc + '/' + pDocItem;
		},
		
		parseValue: function(val) {

			var oFloatNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				minFractionDigits: 2,
				groupingEnabled: true
			}, sap.ui.getCore().getConfiguration().getLocale());

			if (oFloatNumberFormat.format(val) === "") {
				val = 0;
			}

			return oFloatNumberFormat.format(val);
		},
		
		parseUploadDateTime: function(date,time){
			
			var now = new Date();
			var newTime = new Date(time.ms + (now.getTimezoneOffset() * 1000 * 60));
			var newDate = date;
			newDate.setHours(newTime.getHours());
			newDate.setMinutes(newTime.getMinutes());
			newDate.setSeconds(newTime.getSeconds());
			
			var oDateFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd.MM.YYYY HH:mm:ss"
			});
			var pDatetime = oDateFormatter.format(newDate);
		
			return pDatetime;
			
		},
		
		formatFileSize :  function (sValue) {
		   if (jQuery.isNumeric(sValue)) {
		    return sap.ui.core.format.FileSizeFormat.getInstance({
		     maxFractionDigits : 1,
		     maxIntegerDigits : 3
		    }).format(sValue);
		   } else {
		    return sValue;
		   }
		},
		
		formatRowHighlight: function (oValue) {
			// Your logic for rowHighlight goes here
			if (oValue) {
				return "Error";
			} else {
				return "None";
			}
			// return oValue;
		},
		
		parseRefDocLink: function(refDoc,item){
			
			var url = "";
			if(refDoc !== "" && refDoc !== undefined){
				switch (refDoc[0]) {
					case "1": case "W":
						url = "/sap/bc/ui2/flp#ZFIORI-ZLPUBA101_NAV&/PrItem/" + refDoc + "/" + item;
						break;
					case "3": case "4": case "5": case "X": case "Y": case "Z":
						url = "/sap/bc/ui2/flp#ZFIORI-ZLPUBA102_NAV&/PoItem/" + refDoc + "/" + item;
						break;
					case "2":
						url = "/sap/bc/ui2/flp#ZFIORI-ZLPUBA103_NAV&/OaItem/" + refDoc + "/" + item;
						break;
					default:
				}
			}
			return url;
			
		},

		parseEditableByStatus : function(prItem){
			// debugger
			var lvApproveStatus = this.getOwnerComponent().getModel("prHeader").getData().FRGZU;
			var lvPrNo = this.getOwnerComponent().getModel("prHeader").getData().BANFN;

			if(lvPrNo !== "NEW" && lvApproveStatus !== "") { // this is = 0

				return false;


			} else {


				return prItem.LOEKZ === '' && prItem.PSTYP !== 'D';

			}



		}

		
	};
});