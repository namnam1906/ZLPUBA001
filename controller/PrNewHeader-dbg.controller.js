sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"../utilities/Formatter",
	"iam/bc/utilities/ValueHelpCollection",
	"iam/bc/utilities/CommonVHDialog",
	"iam/bc/utilities/Utilities"
], function (BaseController, MessageBox, History, Formatter, ValueHelpCollection, CommonVHDialog, GUtilities) {
	"use strict";

	return BaseController.extend("com.cu.s4hana.zlpuba001.controller.PrNewHeader", {
		
		formatter: Formatter,
		C_MODEL_NAME: {
			prHeader: "prHeader",
			prItem: "prItem",
			prHeaderText: "prHeaderText",
			prItemText: "prItemText",
			attachmentModel: "attachmentModel",
			deletedAttachmentModel: "deletedAttachmentModel",
			controlModel: "controlModel",
			prWorkflowLog: "prWorkflowLog",
			materialGroupList: "materialGroupList",
			materialList: "materialList",
			cartModel: "cartModel",
			errors: "errors",
			userParam: "userParam"
		},

		C_MODEL: {
			prHeader: null,
			prItem: null,
			prHeaderText: null,
			prItemText: null,
			attachmentModel: null,
			deletedAttachmentModel: null,
			controlModel: null,
			prWorkflowLog: null,
			materialGroupList: null,
			materialList: null,
			cartModel: null,
			errors: null,
			userParam: null
		},
		
		isInit: true,
		_formFragments: {},
		uploadFailCount: 0, //CH17: Add
		
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("PrNewHeader").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.initModel();
			// this.getView().addEventDelegate({
	  //           onAfterShow : jQuery.proxy(function(evt) {
	  //                this.onAfterShow(evt);
	  //           }, this)
	  //       });
	         
	         this._MessageManager = new sap.ui.core.message.MessageManager();
	         this.getView().setModel(this._MessageManager.getMessageModel(),"message");
	         //this.createMessagePopover();
		},
		
		createMessagePopover: function () {
			var that = this;
			this.oMP = new sap.m.MessagePopover({
				activeTitlePress: function (oEvent) {
					var oItem = oEvent.getParameter("item"),
						oPage = that.oView.byId("idPrNewHeaderPage"),
						oMessage = oItem.getBindingContext("message").getObject(),
						oControl = sap.ui.getCore().byId(oMessage.getControlId());
					if (oControl) {
						oPage.scrollToElement(oControl.getDomRef(), 200, [0, -100]);
						setTimeout(function(){
							oControl.focus();
						}, 300);
					}
				},
				items: {
					path:"message>/",
					template: new sap.m.MessageItem(
						{
							title: "{message>message}",
							subtitle: "{message>additionalText}",
							groupName: {parts: [{path: 'message>code'}], formatter: this.getGroupName},
							activeTitle: {parts: [{path: 'message>target'},{path: 'message>processor'}], formatter: this.isPositionable},
							type: "{message>type}",
							description: "{message>description}"
						})
				}
			});

			this.oMP._oMessageView.setGroupItems(true);
			this.getView().byId("messagePopoverBtn").addDependent(this.oMP);
		},
		
		handleRequiredField: function (control, controlType, section) {
			var sTarget, val;
			switch (controlType) {
				case "input":
					sTarget = control.getBindingPath("value");
					val = control.getValue();
					break;
				case "select":
					sTarget = control.getBindingPath("selectedKey");
					val = control.getSelectedKey();
					break;
				case "token":
					sTarget = control.getBindingPath("value");
					if(control.getTokens().length > 0){
						val = "ok";
					}else{
						val = "";
					}
					break;
			}
			this.removeMessageFromTarget(sTarget);
			if (!val) {
				this._MessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
						code: section,
						type: sap.ui.core.MessageType.Error,
						additionalText: control.getLabels()[0].getText(),
						description: control.getLabels()[0].getText(),
						target: sTarget,
						processor: this.getView().getModel("prHeader")
					})
				);
			}
		},
		
		removeMessageFromTarget: function (sTarget) {
			this._MessageManager.getMessageModel().getData().forEach(function(oMessage){
				if (oMessage.target === sTarget) {
					this._MessageManager.removeMessages(oMessage);
				}
			}.bind(this));
		},
		
		getGroupName : function (code) {
			if (code) {
				return code;
			}else{
				return "";
			}
		},

		isPositionable : function (target,processor) {
			if(target && processor){
				return true;
			}else{
				return false;
			}
		},
		
		handleMessagePopoverPress: function (oEvent) {
			this.oMP = null;
			if (!this.oMP) {
				this.createMessagePopover();
			}
			this.oMP.toggle(oEvent.getSource());
		},
		
		changeMessageModel: function(sTarget){
			this.removeMessageFromTarget(sTarget);
		},
		
		onExit : function () {
			for (var sPropertyName in this._formFragments) {
				if (!this._formFragments.hasOwnProperty(sPropertyName) || this._formFragments[sPropertyName] === null) {
					return;
				}
				this._formFragments[sPropertyName].destroy();
				this._formFragments[sPropertyName] = null;
			}
		},
		
		_getFormFragment: function (sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];
			if (oFormFragment) {
				return oFormFragment;
			}
			oFormFragment = sap.ui.xmlfragment(this.getView().getId(), "com.cu.s4hana.zlpuba001.view.fragment." + sFragmentName, this);
			this._formFragments[sFragmentName] = oFormFragment;
			return this._formFragments[sFragmentName];
		},

		_showFormFragment : function (sFragmentName) {
			var oPage = this.byId("idPrNewHeaderPage");
			oPage.removeAllContent();
			oPage.insertContent(this._getFormFragment(sFragmentName));
		},
		
		handleRouteMatched: function (oEvent) {
			if (oEvent.getParameters().data) {
				var pr = oEvent.getParameters().data.Pr;
			}
			
			if (this.isInit) {
				// this._showFormFragment("PrNewHeader");
				this.initModel();
				this.resetData();
				this.setMode("EDIT");
				// this.createMessagePopover();
				this.getMaterialGroupList();
				
				if(!pr){
					this.getData();	
				}else{
					this.initCopyData(pr);
				}
				
				if(this._MessageManager){
					this._MessageManager.removeAllMessages();
				};
				
			} else {
				this.updateModelBindings();
				this.isInit = true;
				
				if(this.C_MODEL.errors.getData().length > 0){
					this.syncMessagePopover();
					// var oButton = this.getView().byId("messagePopoverBtn");
					// setTimeout(function(){
					// 	this.oMP.openBy(oButton);
					// }.bind(this), 100);
				}
				
			}
			
			this.initialScreen();
		},
		
		initWithEgpData: function(egpData,materialEgp,materialUnit){
			
			var prHeaderModel = this.C_MODEL.prHeader;
			var prHeaderData = prHeaderModel.getData();
			var prItemModel = this.C_MODEL.prItem;
			var prItemData = prItemModel.getData();
			var prHeaderTextModel = this.C_MODEL.prHeaderText;
			var prHeaderTextData = prHeaderTextModel.getData();
			var prItemTextModel = this.C_MODEL.prItemText;
			var prItemTextData = prItemTextModel.getData();
			var prSum = 0;				//CH12: INS
			
			// PR Header
			prHeaderModel.setProperty("/BANFN", "NEW");
			prHeaderModel.setProperty("/BSART", egpData.BSART);
			prHeaderModel.setProperty("/BSART_NAME", egpData.BSART_NAME);
			
			// PR Header Text
			for(var i=0;i<prHeaderTextData.length;i++){
				if(prHeaderTextData[i].TDID === "B02"){
					// prHeaderTextData[i].DETAIL = egpData.EGPWS0016.projectdetail.field13;		//CH12: DEL
					/* CH12 START INS */
					for(var j=0;j<egpData.EGPWS0007.product.length;j++){
						// for(var j=0;j<prItemTextData.length;j++){
							// if($.extend({},prItemTextData[j]).TDID === "B10"){
								prSum = parseFloat(egpData.EGPWS0007.product[j].field24) + prSum;
							// }
						// }
					}
					prHeaderTextData[i].DETAIL = prSum.toFixed(2);
					/* CH12 END INS */
				}
			}
			
			// PR Item
			for(var i=0;i<egpData.EGPWS0007.product.length;i++){

				//CH15: Ins Start 
				egpData.EGPWS0007.product[i].field11 = '';
				for (var j = 0; j < egpData.EGPWS0006.considerdetail.length; j++) {
					if ( egpData.EGPWS0007.product[i].field1 == egpData.EGPWS0006.considerdetail[j].field1 ){
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๑', '1');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๒', '2');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๓', '3');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๔', '4');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๕', '5');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๖', '6');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๗', '7');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๘', '8');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๙', '9');
						egpData.EGPWS0006.considerdetail[j].field2 = egpData.EGPWS0006.considerdetail[j].field2.replaceAll('๐', '0');
						egpData.EGPWS0007.product[i].field11 = egpData.EGPWS0006.considerdetail[j].field2;
						break;
					}
				}
				//CH15: Ins End

				var rec = {};
				rec.BANFN = "NEW";
				rec.BNFPO = "" + ((i + 1) * 10);
				rec.ZZMMEGP_PROJ = egpData.EGPWS0007.projectid.field1;
				rec.ZZMMEGP_ITEM = egpData.EGPWS0007.product[i].field1;
				// rec.ZZMMEGP_YEAR = egpData.EGPWS0016.projectdetail.field5;		//CH12: DEL
				/* CH12 START INS */
				if (typeof(egpData.EGPWS0016.projectdetail.field5) !== "object") {
					rec.ZZMMEGP_YEAR = egpData.EGPWS0016.projectdetail.field5;
				} else {
					rec.ZZMMEGP_YEAR = egpData.EGP_YEAR;
				}
				/* CH12 END INS */
				
				rec.KNTTP = "-";
				rec.KNTTP_NAME = this.getView().getModel("i18n").getProperty("Label.AccountAssignment.None");
				rec.PSTYP = "0";
				rec.NOLIMIT = false;

				var matEgp = {};
				var materialCount = 0;
				for(var k=0;k<materialEgp.length;k++){
					if(materialEgp[k].GROES === egpData.EGPWS0007.product[i].field2){
						matEgp = materialEgp[k];
						materialCount++;
					}
				}
				if(materialCount === 1){
					rec.MATNR = matEgp.MATNR;
					rec.TXZ01 = matEgp.MAKTX;
					rec.MATKL = matEgp.MATKL;
					rec.MATKL_NAME = matEgp.WGBEZ;
					rec.MEINS = matEgp.MEINS;
					rec.MEINS_NAME = matEgp.MSEHL;
				}else{
					rec.MATNR = "";
					rec.TXZ01 = egpData.EGPWS0007.product[i].field11.slice(0,40);
					for(var m=0;m<materialUnit.length;m++){
						if(parseInt(materialUnit[m].EGP_UNIT) === parseInt(egpData.EGPWS0007.product[i].field12)){
							rec.MEINS = materialUnit[m].SAP_UNIT;
							rec.MEINS_NAME = materialUnit[m].SAP_UNIT_DESC;
						}
					}
				}
				
				rec.MENGE = parseFloat(egpData.EGPWS0007.product[i].field5);
				rec.RLWRT = parseFloat(egpData.EGPWS0007.product[i].field25);
				rec.PEINH = 1;
				if(rec.MENGE > 0){
					rec.PREIS = rec.RLWRT / rec.MENGE;
				}else{
					rec.PREIS = 0;
				}
				
				rec.WAERS = "THB";
				rec.LFDAT = new Date();
				
				rec.WERKS = egpData.WERKS;
				rec.WERKS_NAME = egpData.WERKS_NAME;
				rec.EKGRP = egpData.EKGRP;
				rec.EKGRP_NAME = egpData.EKGRP_NAME;
				
				rec.LOEKZ = '';
				rec.OLD = false;
				
				rec.PrAccAssignment = {results: []};
				rec.PrItemText = {results: []};
				
				var arrText = [];
				for(var j=0;j<prItemTextData.length;j++){
					var text = $.extend({},prItemTextData[j]);
					if(text.TDID === "B01"){
						text.DETAIL = egpData.EGPWS0007.product[i].field11.slice(40);
					}else if(text.TDID === "B07" && prItemData.length === 0){
						// text.DETAIL = egpData.EGPWS0016.projectdetail.field19 + " / " + 
						// 			  egpData.EGPWS0016.projectdetail.field5 + "\r\n" +
						// 			  egpData.EGPWS0016.projectdetail.field6;
						// text.DETAIL = egpData.EGPWS0016.projectdetail.field6;				//CH12: DEL
						/* CH12 START INS */
						if(typeof(egpData.EGPWS0016.projectdetail.field6) !== "object"){
							text.DETAIL = egpData.EGPWS0016.projectdetail.field6;
						}
						/* CH12 END INS */
						if(typeof(egpData.EGPWS0016.projectdetail.field7) !== "object"){
							text.DETAIL = text.DETAIL + egpData.EGPWS0016.projectdetail.field7;
						}	 
						if(typeof(egpData.EGPWS0016.projectdetail.field8) !== "object"){
							text.DETAIL = text.DETAIL + egpData.EGPWS0016.projectdetail.field8;
						}
					}else if(text.TDID === "B10"){
						// text.DETAIL = egpData.EGPWS0007.product[i].field24;					//CH12: DEL
						text.DETAIL = parseFloat(egpData.EGPWS0007.product[i].field24).toFixed(2); 		 //CH12: INS
					}
					arrText.push(text);
				}
				
				rec.PrItemText.results = arrText;
				
				prItemData.push(rec);
				
			}
			
			prItemModel.setData([]);
			prItemModel.setData(prItemData);
			
		},
		
		syncMessagePopover: function(){
			
			var messageModel = this.getOwnerComponent().getModel("errors");
			var messageData = $.extend([],messageModel.getData());
			
			this._MessageManager = new sap.ui.core.message.MessageManager();
	        this.getView().setModel(this._MessageManager.getMessageModel(),"message");
	        this.createMessagePopover();
			
			for(var i=0;i<messageData.length;i++){
				if(messageData[i].target === "/BSART"){
					var target = "";
					var controlId = "";
					target = this.getView().byId("idDocumentType").getBindingPath("value");
					controlId = this.getView().byId("idDocumentType").getId();
					
					if(target){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: messageData[i].message,
								code: messageData[i].code,
								type: sap.ui.core.MessageType.Error,
								additionalText: messageData[i].additionalText,
								description: messageData[i].description,
								target: target,
								processor: this.getView().getModel("prHeader"),
								controlId: controlId
							})
						);
					}
				}else{
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: messageData[i].message,
							code: messageData[i].code,
							type: sap.ui.core.MessageType.Error,
							additionalText: messageData[i].additionalText,
							description: messageData[i].description,
							target: "",
							processor: ""
						})
					);
				}
			}
			
		},
		
		initialScreen: function () {
            if (!this.oVHCollection) this.oVHCollection = new ValueHelpCollection(this.getView().getModel());
        },
		
		initModel: function () {

			var prHeaderModel = new sap.ui.model.json.JSONModel();
			this.getOwnerComponent().setModel(prHeaderModel, this.C_MODEL_NAME.prHeader);
			this.C_MODEL.prHeader = prHeaderModel;

			var prItemModel = new sap.ui.model.json.JSONModel([]);
			this.getOwnerComponent().setModel(prItemModel, this.C_MODEL_NAME.prItem);
			this.C_MODEL.prItem = prItemModel;
			
			var prHeaderTextModel = new sap.ui.model.json.JSONModel([]);
			this.getOwnerComponent().setModel(prHeaderTextModel, this.C_MODEL_NAME.prHeaderText);
			this.C_MODEL.prHeaderText = prHeaderTextModel;
			
			var prItemTextModel = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(prItemTextModel, this.C_MODEL_NAME.prItemText);
			this.C_MODEL.prItemText = prItemTextModel;
			
			var attachmentModel = new sap.ui.model.json.JSONModel([]);
			this.getOwnerComponent().setModel(attachmentModel, this.C_MODEL_NAME.attachmentModel);
			this.C_MODEL.attachmentModel = attachmentModel;
			
			var deletedAttachmentModel = new sap.ui.model.json.JSONModel([]);
			this.getOwnerComponent().setModel(deletedAttachmentModel, this.C_MODEL_NAME.deletedAttachmentModel);
			this.C_MODEL.deletedAttachmentModel = deletedAttachmentModel;
			
			var controlModel = new sap.ui.model.json.JSONModel();
			this.getOwnerComponent().setModel(controlModel, this.C_MODEL_NAME.controlModel);
			this.C_MODEL.controlModel = controlModel;
			
			var prWorkflowLogModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(prWorkflowLogModel, this.C_MODEL_NAME.prWorkflowLog);
			this.C_MODEL.prWorkflowLog = prWorkflowLogModel;
			
			var materialGroupListModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(materialGroupListModel, this.C_MODEL_NAME.materialGroupList);
			this.C_MODEL.materialGroupList = materialGroupListModel;
			
			var materialListModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(materialListModel, this.C_MODEL_NAME.materialList);
			this.C_MODEL.materialList = materialListModel;
			
			var cartModel = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(cartModel, this.C_MODEL_NAME.cartModel);
			this.C_MODEL.cartModel = cartModel;

			var errorsModel = new sap.ui.model.json.JSONModel();
			this.getOwnerComponent().setModel(errorsModel, this.C_MODEL_NAME.errors);
			this.C_MODEL.errors = errorsModel;
			
			var userParam = new sap.ui.model.json.JSONModel({});
			this.getOwnerComponent().setModel(userParam, this.C_MODEL_NAME.userParam);
			this.C_MODEL.userParam = userParam;

		},
		
		initCopyData: function(pr){
			var that = this;
			var aDefer = [];
			if (that.getView().getBusy() === false) {
				that.getView().setBusyIndicatorDelay(0);
				that.getView().setBusy(true);
			}
			aDefer.push(that.getPrData(pr));
			aDefer.push(that.getUserParameters());
			$.when.apply($, aDefer).then(function (status, status2) {
				that.getPrItemData(pr);
			});
		},
		
		setMode: function(pMode){
			var controlModel = this.C_MODEL.controlModel;
			controlModel.setData({
				mode: pMode
			});
		},
		
		updateModelBindings: function(){
			this.C_MODEL.prHeader.updateBindings();
			this.C_MODEL.prItem.updateBindings();
			this.C_MODEL.prHeaderText.updateBindings();
			this.C_MODEL.controlModel.updateBindings();
			this.C_MODEL.attachmentModel.updateBindings();
		},
		
		resetData: function () {

			this.C_MODEL.prHeader.setData({});
			this.getOwnerComponent().getModel(this.C_MODEL_NAME.prHeader).setData({});
			this.C_MODEL.prHeader.refresh();
			
			this.C_MODEL.prItem.setData([]);
			this.getOwnerComponent().getModel(this.C_MODEL_NAME.prItem).setData([]);
			this.C_MODEL.prItem.refresh();
			
			this.C_MODEL.prHeaderText.setData([]);
			this.getOwnerComponent().getModel(this.C_MODEL_NAME.prHeaderText).setData([]);
			this.C_MODEL.prHeaderText.refresh();
			
			this.C_MODEL.prItemText.setData([]);
			this.getView().getModel(this.C_MODEL_NAME.prItemText).setData([]);
			this.C_MODEL.prItemText.refresh();
			
			this.C_MODEL.controlModel.setData({});
			this.getOwnerComponent().getModel(this.C_MODEL_NAME.controlModel).setData([]);
			this.C_MODEL.controlModel.refresh();
			
			this.C_MODEL.attachmentModel.setData([]);
			this.getOwnerComponent().getModel(this.C_MODEL_NAME.attachmentModel).setData([]);
			this.C_MODEL.attachmentModel.refresh();
			
			this.C_MODEL.deletedAttachmentModel.setData([]);
			this.getOwnerComponent().getModel(this.C_MODEL_NAME.deletedAttachmentModel).setData([]);
			this.C_MODEL.deletedAttachmentModel.refresh();
			
			this.C_MODEL.materialGroupList.setData([]);
			this.getView().getModel(this.C_MODEL_NAME.materialGroupList).setData([]);
			this.C_MODEL.materialGroupList.refresh();
			
			this.C_MODEL.materialList.setData([]);
			this.getView().getModel(this.C_MODEL_NAME.materialList).setData([]);
			this.C_MODEL.materialList.refresh();
			
			this.C_MODEL.cartModel.setData([]);
			this.getView().getModel(this.C_MODEL_NAME.cartModel).setData([]);
			this.C_MODEL.cartModel.refresh();

			if(this._MessageManager){
				this._MessageManager.removeAllMessages();
			}

		},
		
		getData: function () {
			var that = this;
			var aDefer = [];
			if (that.getView().getBusy() === false) {
				that.getView().setBusyIndicatorDelay(0);
				that.getView().setBusy(true);
			}
			aDefer.push(that.getPrHeaderTextData());
			aDefer.push(that.getPrItemTextData());
			aDefer.push(that.getMaterialEgpData());
			aDefer.push(that.getMaterialUnitData());
			aDefer.push(that.getUserParameters());
			$.when.apply($, aDefer).then(function (status1,status2,materialEgp,materialUnit) {
				
				var prEgpModel = that.getOwnerComponent().getModel("prEgpData");
				if(prEgpModel){
					var prEgpData = prEgpModel.getData();
					if(prEgpData.EGPWS0016 && prEgpData.EGPWS0006 && prEgpData.EGPWS0007){
						that.initWithEgpData(prEgpData,materialEgp,materialUnit);
					}
				}
				
				that.C_MODEL.prHeader.setProperty("/BANFN", "NEW");
				that.C_MODEL.prHeader.setProperty("/FRGZU", "");
				that.updateModelBindings();
				
				that._showFormFragment("PrNewHeader");
				that.createMessagePopover();
				that.onAfterShowView();
				
				if (that.getView().getBusy() === true) {
					that.getView().setBusy(false);
				}
			});
		},
		
		getUserParameters: function() {
			
			var that = this;	
			var defer = new $.Deferred();
			var lvUser = "";
			var srvModel = this.getView().getModel();
			var userParam = this.C_MODEL.userParam;
			
			if(sap.ushell !== undefined){
				lvUser = sap.ushell.Container.getService("UserInfo").getId();
			}else{
				defer.resolve();
				return;
			}

			var path = "/UserAuthorizationSet('" + lvUser + "')";
			srvModel.read(path, {
				success: function (s) {
					userParam.setData({});
					userParam.setData(s);
					userParam.updateBindings();
					that.collectFileSize(parseInt(s.FILE_SIZE));
					defer.resolve();
				},
				error: function (e) {
					userParam.setData({});
					userParam.updateBindings();
					defer.resolve();
				}
			});

			return defer;

		},
		
		collectFileSize: function(file_size){
			var oComponent = this.getOwnerComponent();
            var mFileSize = new sap.ui.model.json.JSONModel();
            mFileSize.setData({"limit":file_size});
            oComponent.setModel(mFileSize, "mFileSize");
        },
		
		getPrHeaderTextData: function () {
			var srvModel = this.getView().getModel();
			var prHeaderText = this.C_MODEL.prHeaderText;
			var defer = new $.Deferred();
			var path = "/PrHeaderTextSet";
			srvModel.read(path, {
				success: function (s) {
					prHeaderText.setData([]);
					prHeaderText.setData(s.results);
					defer.resolve();
				},
				error: function (pError) {
					defer.resolve();
				}
			});
			return defer;
		},
		
		getPrItemTextData: function () {
			var srvModel = this.getView().getModel();
			var prItemText = this.C_MODEL.prItemText;
			var defer = new $.Deferred();
			var path = "/PrItemTextSet";
			srvModel.read(path, {
				success: function (s) {
					prItemText.setData([]);
					prItemText.setData(s.results);
					defer.resolve();
				},
				error: function (pError) {
					defer.resolve();
				}
			});
			return defer;
		},
		
		getMaterialEgpData: function () {
			var that = this;
			var defer = new $.Deferred();
			
			var prEgpModel = that.getOwnerComponent().getModel("prEgpData");
			if(prEgpModel){
				var prEgpData = prEgpModel.getData();
				if(!prEgpData.EGPWS0006 || !prEgpData.EGPWS0007 || !prEgpData.EGPWS0016){
					return defer.resolve([]);	
				}
			}else{
				return defer.resolve([]);
			}
					
			var aFilters = [];
			for(var i=0;i<prEgpData.EGPWS0007.product.length;i++){
				aFilters.push(new sap.ui.model.Filter("GROES","EQ",prEgpData.EGPWS0007.product[i].field2,""));
			};
			
			var srvModel = this.getView().getModel();
			var prHeaderText = this.C_MODEL.prHeaderText;
			var defer = new $.Deferred();
			var path = "/MatInfoSet";
			srvModel.read(path, {
				filters: aFilters,
				success: function (s) {
					defer.resolve(s.results);
				},
				error: function (pError) {
					defer.resolve([]);
				}
			});
			return defer;
		},
		
		getMaterialUnitData: function () {
			var that = this;
			var defer = new $.Deferred();
			
			var prEgpModel = that.getOwnerComponent().getModel("prEgpData");
			if(prEgpModel){
				var prEgpData = prEgpModel.getData();
				if(!prEgpData.EGPWS0006 || !prEgpData.EGPWS0007 || !prEgpData.EGPWS0016){
					return defer.resolve([]);	
				}
			}else{
				return defer.resolve([]);
			}
			
			var aFilters = [];
			for(var i=0;i<prEgpData.EGPWS0007.product.length;i++){
				aFilters.push(new sap.ui.model.Filter("EGP_UNIT","EQ",prEgpData.EGPWS0007.product[i].field12,""));
			};
			
			var srvModel = this.getView().getModel();
			var prHeaderText = this.C_MODEL.prHeaderText;
			var defer = new $.Deferred();
			var path = "/F4EgpUnitSet";
			srvModel.read(path, {
				filters: aFilters,
				success: function (s) {
					defer.resolve(s.results);
				},
				error: function (pError) {
					defer.resolve([]);
				}
			});
			return defer;
		},
		
		handleAddItemToCart: function(oEvent){
			
			var cartModel = this.C_MODEL.cartModel;
			var cartData = cartModel.getData();
			var index = oEvent.getSource().getParent().getBindingContext("materialList").getObject();
			
			index.QTY = 1;
			cartData.push(index);
			cartModel.setData([]);
			cartModel.setData(cartData);
			cartModel.updateBindings();
			
			this.C_MODEL.controlModel.setProperty("/cartLength", cartData.length);
			this.C_MODEL.controlModel.updateBindings();
			
			var msg = this.getView().getModel("i18n").getProperty("Message.AddToCartSuccess");
			sap.m.MessageToast.show(msg, {
				duration: 1000
			});
			
		},
		
		handleDeleteFromCart: function(oEvent){
			
			var path = oEvent.getParameter('listItem').getBindingContext("cartModel").getPath();
			var idx = parseInt(path.substring(path.lastIndexOf('/') + 1));
			var model = this.C_MODEL.cartModel;
			var data = model.getData();
			data.splice(idx, 1);
			model.setData(data);
			model.updateBindings();
			
			this.C_MODEL.controlModel.setProperty("/cartLength", data.length);
			this.C_MODEL.controlModel.updateBindings();
			
			if(data.length === 0){
				this.handleCloseCartDialog();
			}
			
		},
		
		handleAddCartToPr: function (oEvent) {
			var that = this;
			
			that.handleCloseCartDialog();
			that.handleCloseAddItemToCartDialog();         
			
			if (that.getView().getBusy() === false) {
				that.getView().setBusyIndicatorDelay(0);
				that.getView().setBusy(true);
			}
			
			var srvModel = this.getView().getModel();
			var path = "/PrItemTextSet";
			srvModel.read(path, {
				success: function (s) {
					that.doAddCartToPr(s.results);
					
					if (that.getView().getBusy() === true) {
						that.getView().setBusy(false);
					}
				
				},
				error: function (e) {
					
					if (that.getView().getBusy() === true) {
						that.getView().setBusy(false);
					}
						
				}
			});
		},
		
		doAddCartToPr: function(itemText){
			
			var that = this;
			
			var prHeaderData = that.C_MODEL.prHeader.getData();
			var prItemModel = that.C_MODEL.prItem;
			var prItemData = prItemModel.getData();
			var userParamModel = this.getOwnerComponent().getModel("userParam");
			if(userParamModel){
				var param = userParamModel.getData();
			}
			
			var it = $.extend([],that.C_MODEL.cartModel.getData());
			var currentItem = that.getCurrentMaxItemNumber();
			
			for(var i=0;i<it.length;i++){
				
				currentItem = currentItem + 10;
				
				var record = {};
				// record.BANFN = "" + prHeaderData.BANFN;
				record.BANFN = "NEW";
				record.BNFPO = "" + currentItem;
				record.MATNR = it[i].MATNR;
				record.TXZ01 = it[i].MAKTX;
				record.MATKL = it[i].MATKL;
				record.MATKL_NAME = it[i].WGBEZ;
				record.MENGE = it[i].QTY;
				record.MEINS = it[i].MEINS;
				record.MEINS_NAME = it[i].MSEHL;
				
				record.EKGRP = "";
				record.LIFNR = "";
				record.AFNAM = "";     
				record.ZZMMEGP_PROJ = "";
				record.ZZMMEGP_ITEM = "";
				record.BEDNR = "";
				
				// record.WERKS = "";
				record.WERKS = param.WERKS;
				record.WERKS_NAME = param.NAME1;
				
				record.LGORT = "";
				record.PREIS = "";
				record.RLWRT = "";
				
				
				record.LOEKZ = "";
				record.OLD = false;
				record.WAERS = "THB";
				record.PEINH = 1;
				record.LFDAT = new Date();
				record.PSTYP = "0";
				record.KNTTP = "";
				
				record.GEBER = "";
				record.FKBER = "";
				record.FISTL = "";
				record.FIPOS = "";
				record.KBLNR = "";
				record.KBLPOS = "";
				
				record.PrAccAssignment = {results: []};
				record.PrItemText = {results: itemText};
				
				prItemData.push(record);
				
			}
			
			prItemModel.setData([]);
			prItemModel.setData(prItemData);
			prItemModel.updateBindings();
				
		},
		
		handleCartPress: function(oEvent){
			
			var that = this;
			if (!this._oCartDialog) {
				this._oCartDialog = sap.ui.xmlfragment("com.cu.s4hana.zlpuba001.view.fragment.CartDialog", this);
			}
			this._oCartDialog.setModel(this.getView().getModel());
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oCartDialog);
			this.getView().addDependent(this._oCartDialog);

			this._oCartDialog.open();
			
		},
		
		handleCloseCartDialog: function(oEvent){
			// this._oAddItemToCartDialog.getContent()[0].removeSelections();
			this._oCartDialog.close();
			this._oCartDialog.destroy();
			this._oCartDialog = null;
		},
		
		handleAddToCart: function(oEvent){
			
			this.C_MODEL.cartModel.setData([]);
			this.C_MODEL.cartModel.updateBindings();
			this.C_MODEL.materialList.setData([]);
			this.C_MODEL.materialList.updateBindings();
			this.C_MODEL.controlModel.setProperty("/cartLength", 0);
			this.C_MODEL.controlModel.updateBindings();
			
			var that = this;
			if (!this._oAddItemToCartDialog) {
				this._oAddItemToCartDialog = sap.ui.xmlfragment("com.cu.s4hana.zlpuba001.view.fragment.AddItemToCart", this);
			}
			this._oAddItemToCartDialog.setModel(this.getView().getModel());
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oAddItemToCartDialog);
			this.getView().addDependent(this._oAddItemToCartDialog);

			this._oAddItemToCartDialog.open();
			
		},
		
		handleCloseAddItemToCartDialog: function(oEvent){
			// this._oAddItemToCartDialog.getContent()[0].removeSelections();
			this._oAddItemToCartDialog.close();
			this._oAddItemToCartDialog.destroy();
			this._oAddItemToCartDialog = null;
		},
		
		getMaterialGroupList: function () {

			var that = this;
			var srvModel = this.getView().getModel();
			var materialGroupList = this.C_MODEL.materialGroupList;
			var defer = new $.Deferred();

			var path = "/MatGroupSet";

			srvModel.read(path, {

				success: function (s) {
					
					for(var i=0;i<s.results.length;i++){
						s.results[i].MAT_NUMC = parseInt(s.results[i].MAT_NUMC);
					}

					materialGroupList.setData([]);
					materialGroupList.setData(s.results);

					defer.resolve();

				},

				error: function (pError) {
					defer.resolve();
				}

			});

			return defer;

		},
		
		getMaterialList: function (materialGroup) {

			var that = this;
			var srvModel = this.getView().getModel();
			var materialList = this.C_MODEL.materialList;
			var defer = new $.Deferred();
			
			var aFilters = [];
			
			if(materialGroup){
				aFilters.push(new sap.ui.model.Filter("MATKL","EQ",materialGroup,""));
			}
			
			var path = "/MatInfoSet";

			srvModel.read(path, {
				
				filters: aFilters,

				success: function (s) {

					materialList.setData([]);
					materialList.setData(s.results);

					defer.resolve();

				},

				error: function (pError) {
					defer.resolve();
				}

			});

			return defer;

		},
		
		handlePressMaterialGroup: function(oEvent){
			
			var selectedMaterialGroup = oEvent.getParameters().listItem.getBindingContext("materialGroupList").getObject().MATKL;
			this.getMaterialList(selectedMaterialGroup);
			
		},
		
		onLiveSearchMaterialGroup: function(oEvent){
			
			var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
			
			var aFinalFilters = [];
			var aFilters = [];
			if (sQuery && sQuery.length > 0) {
				aFilters.push(new sap.ui.model.Filter("MATKL", sap.ui.model.FilterOperator.Contains, sQuery));
				aFilters.push(new sap.ui.model.Filter("WGBEZ", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, false)] : [];
			
			var binding = oEvent.getSource().getParent().getParent().getBinding("items");
			binding.filter(aFinalFilters);
			
		},
		
		onLiveSearchMaterial: function(oEvent){
			
			var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
			
			var aFinalFilters = [];
			var aFilters = [];
			if (sQuery && sQuery.length > 0) {
				aFilters.push(new sap.ui.model.Filter("MATNR", sap.ui.model.FilterOperator.Contains, sQuery));
				aFilters.push(new sap.ui.model.Filter("MAKTX", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, false)] : [];
			
			var binding = oEvent.getSource().getParent().getParent().getBinding("items");
			binding.filter(aFinalFilters);
			
		},
		
		onAfterShowView:function(oEvent){
			var objectPageLayout = this.getView().getContent()[0].getContent()[0];
			var firstSectionId = objectPageLayout.getSections()[0].getId();
			objectPageLayout.setSelectedSection(firstSectionId);
		},
		
		getPrData: function (pr) {

			var that = this;
			var srvModel = this.getView().getModel();
			var prHeader = this.C_MODEL.prHeader;
			var prItem = this.C_MODEL.prItem;
			var prHeaderText = this.C_MODEL.prHeaderText;
			var prAttachment = this.C_MODEL.prAttachment;
			var prWorkflowLog = this.C_MODEL.prWorkflowLog;
			var defer = new $.Deferred();

			var path = "/PrHeaderSet('" + pr + "')";

			srvModel.read(path, {

				urlParameters: {
					"$expand": "PrItem,PrHeaderText"
				},

				success: function (s) {
					
					// Pr Header Data
					var hd = $.extend({}, s);
					if (hd.BADAT) hd.BADAT.setHours(0);
					hd.BANFN = "NEW";
					hd.ZZMM_NO_ESIGN = false;
					hd.FRGZU = "";
					prHeader.setData({});
					prHeader.setData(hd);
					
					// PR Item Data
					for (var i = 0; i < s.PrItem.results.length; i++) {
						s.PrItem.results[i].BANFN = "NEW";
						if(s.PrItem.results[i].NOLIMIT){
							s.PrItem.results[i].NOLIMIT = true;
						}else{
							s.PrItem.results[i].NOLIMIT = false;
						}
					}
					prItem.setData([]);
					prItem.setSizeLimit(s.PrItem.results.length);//++CH04-2
					prItem.setData(s.PrItem.results);
					
					// PR Header Text Data
					for (var i = 0; i < s.PrHeaderText.results.length; i++) {
						s.PrHeaderText.results[i].BANFN = "NEW";
					}
					prHeaderText.setData([]);
					prHeaderText.setData(s.PrHeaderText.results);

					defer.resolve();

				},

				error: function (pError) {
					defer.resolve();
				}

			});

			return defer;

		},
		
		onTextBoxLiveChange: function (oEvent) {
            // debugger;
            GUtilities.formatTextArea(oEvent, 120);
        },
		
		handleChangeLongText: function(oEvent){
			if(oEvent.getSource().getValue()){
				oEvent.getSource().getParent().setIconColor("Positive");
			}else{
				oEvent.getSource().getParent().setIconColor("Neutral");
			}
		},
		
		handleBackPress: function () {
			var that = this;
			var mode = that.C_MODEL.controlModel.getData().mode;
			sap.m.MessageBox.warning(that.getView().getModel("i18n").getProperty("Message.CancelCreatePr"), {
				title: that.getView().getModel("i18n").getProperty("Label.Confirm"),
				styleClass: "",
				initialFocus: null,
				textDirection: sap.ui.core.TextDirection.Inherit,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === "YES") {
						that.doNavBack();
					}
				}
			});
		},
		
		doNavBack: function(){
			this.isInit = true;
			
			if(this._MessageManager){
				this.getOwnerComponent().getModel("errors").setData([]);
				this.getOwnerComponent().getModel("errors").updateBindings();
				this._MessageManager.removeAllMessages();
			}
			
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("default", true);
		},
		
		handleFileDelete: function (oEvent) {
			
			var obj = oEvent.getSource().getBindingContext("attachmentModel").getObject();
			oEvent.getSource().getParent().removeItem(oEvent.getSource());
			
			var deletedAttachModel = this.C_MODEL.deletedAttachmentModel;
			var deletedAttachData = deletedAttachModel.getData();
			if(obj.OLD){
				deletedAttachData.push(obj);
			}
			deletedAttachModel.setData([]);
			deletedAttachModel.setData(deletedAttachData);
			deletedAttachModel.updateBindings();
			
		},
		
		handleFileBeforeUpload: function(oEvent) {
			var serviceModel = this.oView.getModel();
			var token = serviceModel.getSecurityToken();
			// Header Slug
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: encodeURIComponent(oEvent.getParameter("fileName"))
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);

			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: token
			});
			if(!oEvent.getParameters().getHeaderParameter("x-csrf-token")){
				oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			}
		},
		
		// handleFileUploadComplete: function (oEvent) { //CH17 comment
	    handleFileUploadComplete: async function (oEvent) {  //CH17 added

			var that = this;

			var oFile = oEvent.getParameter("files")[0];
			var fName = oFile.fileName;
			var status = oFile.status;
			var responseRaw = oFile ? oFile.responseRaw : "";
		//==================== CH17:Start Add  ===========================
				if (status < 200 || status >= 300) {
						
						var oExistingDialog = sap.ui.getCore().byId("attachErrorDialog");
						
						if (!oExistingDialog) {
							await this.showErrorAttachFile();
						}
						var defer = that.aStackUploadDefer.pop();
						if (defer) {
							defer.resolve();
						}
						this.aUploadItem.push({ fileName: fName, status: status, response: responseRaw });			
						return;
					}
		//==================== CH17:End Add  ===========================
			var defer = that.aStackUploadDefer.pop();
			defer.resolve();

			this.aUploadItem.push({
				fileName: fName,
				status: status,
				response: responseRaw
			});
		},
		//===========================  CH17:Start Add  ===========================
		showErrorAttachFile: function () {
				var that = this;
				return new Promise(function (resolve) {

				var oDialog = new sap.m.Dialog({
					id: "attachErrorDialog",
					title: that.getView().getModel("i18n").getProperty("Message.ErrorTitle"),
					type: "Message",
					state: "Error",
					content: new sap.m.Text({
						text: that.getView().getModel("i18n").getProperty("Message.ErrorAttachment")
					}),
					endButton: new sap.m.Button({
						text: "ปิด",
						press: function () {
							oDialog.close();							
						}
					}),
					afterClose: function () {
						oDialog.destroy();
						resolve();
					}
				});

				oDialog.open();
			});
		},
		//===========================  CH17:End Add  ===========================
		handleFileUploadTerminate: function(oEvent) {
			var that = this;
			var defer = that.aStackUploadDefer.pop();
			defer.resolve();
		},
		
		handleFileSizeExceed: function () {
			var that = this;
			var limitSize = that.getOwnerComponent().getModel("mFileSize").getProperty("/limit");
			return new Promise(function (fnResolve) {
				sap.m.MessageBox.warning(that.getView().getModel("i18n").getResourceBundle().getText("Message.FileTooLargeDetail", [limitSize]), {
					title: that.getView().getModel("i18n").getProperty("Message.FileTooLargeTitle"),
					onClose: function () {
						fnResolve();
					}
				});
			}).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		
		handlePrItemPress: function (oEvent) {
			
			this.isInit = false;
			this.syncErrorMessages();

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext("prItem");
			var Pr = oBindingContext.getObject().BANFN;
			var PrItem = oBindingContext.getObject().BNFPO;

			return new Promise(function (fnResolve) {
				this.doNavigate("PrItem", oBindingContext, fnResolve, "", Pr, PrItem);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		
		syncErrorMessages: function(){
			
			if(!this._MessageManager){
				return;
			}
			
			var messageData = this._MessageManager.getMessageModel().getData();
			var arr = [];
			for(var i=0;i<messageData.length;i++){
				var msg = $.extend({}, messageData[i]);
				arr.push(msg);
			}
			this.C_MODEL.errors.setData([]);
			this.C_MODEL.errors.setData(arr);
			this.C_MODEL.errors.updateBindings();
			this._MessageManager.removeAllMessages();
			
		},
		
		doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation, Pr, PrItem) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
					sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function (bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				
				switch (sRouteName) {
					case "PrHeader":
						this.oRouter.navTo(sRouteName, {
							Pr: Pr
						});
						break;
					case "PrItem":
						this.oRouter.navTo(sRouteName, {
							Pr: Pr,
							PrItem: PrItem
						});
						break;
					case "PrNewItem":
						this.oRouter.navTo(sRouteName, {
							Pr: Pr,
							PrItem: PrItem
						});
						break;
					case "AssignPeople":
						this.oRouter.navTo(sRouteName, {
							Pr: Pr
						});
						break;
					default:
				}
				
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		
		onVHDocumentType: function (oEvent) {

			var that = this;
			var model = this.C_MODEL.prHeader;
			var index = model.getData();
			var oInputControl = oEvent.getSource();
			var aTokens = [];
			var mService = that.getOwnerComponent().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
			
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.PrDocType"),
				key: "BSART",
				descriptionKey: "",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "BSART",
					label: this.getView().getModel("i18n").getProperty("Label.PrDocType")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
						index.BSART = pSelected.BSART;
                    	index.BSART_NAME = pSelected.BATXT;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.PrDocType"),
                        template: "BSART",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.PrDocTypeName"),
                        template: "BATXT",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4PrTypeSet"
				},
				basicTokens: aTokens,
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BSART",
                        label: this.getView().getModel("i18n").getProperty("Label.PrDocType"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BATXT",
                        label: this.getView().getModel("i18n").getProperty("Label.PrDocTypeName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		},
		
		onChangeDocumentType: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prHeader = that.C_MODEL.prHeader;
			var docType = prHeader.getProperty("/BSART");
			var sTarget = oEvent.getSource().getBindingPath("value");

			if (!docType) {
				prHeader.setProperty("/BSART", "");
				prHeader.setProperty("/BSART_NAME", "");
				// prHeader.setProperty("/ZZMM_NO_ESIGN", false);
				return;
			}

			var path = "/F4PrTypeSet(BSTYP='B',BSART='" + docType + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prHeader.setProperty("/BSART", s.BSART);
					prHeader.setProperty("/BSART_NAME", s.BATXT);
                	
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					prHeader.setProperty("/BSART", "");
					prHeader.setProperty("/BSART_NAME", "");
					// prHeader.setProperty("/ZZMM_NO_ESIGN", false);

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHUnit: function (oEvent) {

			var that = this;
			var model = oEvent.getSource().getBindingContext("prItem").getModel();
			var index = oEvent.getSource().getBindingContext("prItem").getProperty()
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Unit"),
				key: "ZUNIT",
				descriptionKey: "MSEHL",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "ZUNIT",
					label: this.getView().getModel("i18n").getProperty("Label.Unit")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.MEINS = pSelected.ZUNIT;
                    	index.MEINS_NAME = pSelected.MSEHL;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [{
					label: this.getView().getModel("i18n").getProperty("Label.Unit"),
					template: "ZUNIT",
					demandPopin: true
				}, {
					label: this.getView().getModel("i18n").getProperty("Label.UnitName"),
					template: "MSEHL",
					demandPopin: true
				}],
				datas: {
					odataModel: mService,
					entitySet: "/F4UnitSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [{
					groupTitle: "",
					groupName: "group1",
					name: "ZUNIT",
					label: this.getView().getModel("i18n").getProperty("Label.Unit"),
					control: new sap.m.Input(),
					operation: "NE"
				}, {
					groupTitle: "",
					groupName: "group1",
					name: "MSEHL",
					label: this.getView().getModel("i18n").getProperty("Label.UnitName"),
					control: new sap.m.Input(),
					operation: "NE"
				}]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeUnit: function (oEvent) {

			//Get Material Unit
			var that = this;
			var srvModel = that.getView().getModel();
			var model = this.C_MODEL.prItem;
			var index = oEvent.getSource().getBindingContext("prItem").getProperty();
			var unit = index.MEINS_NAME;
			var sTarget = oEvent.getSource().getBindingPath("value");

			if (!unit) {
				index.MEINS = "";
				index.MEINS_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4UnitSet('" + unit + "')";

			srvModel.read(path, {

				success: function (s) {
					
					index.MEINS = s.ZUNIT;
					index.MEINS_NAME = s.MSEHL;
					model.updateBindings();
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					index.MEINS = "";
					index.MEINS_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onChangeQty: function(oEvent){
			
			var inputValue = oEvent.getParameters().newValue;
			oEvent.getSource().setValue(GUtilities.formatAmount(inputValue));
			
			var index = oEvent.getSource().getBindingContext("prItem").getProperty();
			if(index.PEINH === 1){
				index.RLWRT = index.MENGE * index.PREIS;
			}else{
				index.RLWRT = ( index.MENGE / index.PEINH ) * index.PREIS;
			}
		},
		
		onChangeUnitPrice: function(oEvent){
			
			var inputValue = oEvent.getParameters().newValue;
			oEvent.getSource().setValue(GUtilities.formatAmount(inputValue));
			
			var index = oEvent.getSource().getBindingContext("prItem").getProperty();
			if(index.PREIS !== 0){
				if(index.PEINH === 1){
					index.RLWRT = index.MENGE * index.PREIS;
				}else{
					index.RLWRT = ( index.MENGE / index.PEINH ) * index.PREIS;
				}
			}
		},
		
		onChangeTotalValue: function(oEvent){
			
			var inputValue = oEvent.getParameters().newValue;
			oEvent.getSource().setValue(GUtilities.formatAmount(inputValue));
			
			var index = oEvent.getSource().getBindingContext("prItem").getProperty();
			if(index.PREIS !== 0){
				index.MENGE = index.RLWRT / index.PREIS;
			}
		},
		
		getPrItemByEgp: function () {
			var that = this;
			var srvModel = this.getView().getModel();
			var defer = new $.Deferred();
			var path = "/PrItemSet";
			
			var prEgpModel = that.getOwnerComponent().getModel("prEgpData");
			if(prEgpModel){
				var prEgpData = prEgpModel.getData();
				if(!prEgpData.EGPWS0016 || !prEgpData.EGPWS0006 || !prEgpData.EGPWS0007){
					return defer.resolve();
				}
			}else{
				return defer.resolve();
			};

			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("ZZMMEGP_PROJ","EQ", prEgpData.EGPWS0016.projectdetail.field19,""));
			srvModel.read(path, {
				filters: aFilters,
				success: function (s) {
					
					var arr = [];
					for(var i=0;i<s.results.length;i++){
						var rec = s.results[i];
						if(rec.LOEKZ === ''){
							arr.push(rec);
						}
					}
					defer.resolve(arr);
				},
				error: function (e) {
					defer.resolve([]);
				}
			});
			
			return defer;
		},
		
		handleHoldPrPress: function(oEvent){
			// this.beforeDoCreatePrPress(true);
			this.doCreatePrPress(true,false);
		},
		
		handleCreatePrPress: function(oEvent){
			// this.beforeDoCreatePrPress(false);
			this.doCreatePrPress(false,false);
		},
		
		handleCheckPrPress: function(oEvent){
			this.doCreatePrPress(false,true);
		},
		
		doCreatePrPress: function(isHold,isCheck){
			var that = this;
			var oButton = this.getView().byId("messagePopoverBtn");
			
			// Remove all messages before call new request
			this._MessageManager.getMessageModel().getData().forEach(function(oMessage){
				this._MessageManager.removeMessages(oMessage);
			}.bind(this));
			
			this._MessageManager = new sap.ui.core.message.MessageManager();
			this.getView().setModel(this._MessageManager.getMessageModel(), "message");
			this.createMessagePopover();
			
			if (this.validateDataForSave(isCheck)) {
				var dataForSave = that.createDataForSave(isHold,isCheck);
				this.getView().setBusyIndicatorDelay(0);
				this.getView().setBusy(true);
				var serviceUrl = this.oView.getModel().sServiceUrl;
				var odataServiceModel = new sap.ui.model.odata.v2.ODataModel(serviceUrl);
				var pr = dataForSave.BANFN;
				var prType = dataForSave.BSART;
				odataServiceModel.refreshSecurityToken();
				odataServiceModel.create("/PrHeaderSet", dataForSave, {
					success: function (s) {
						if(isCheck){
							if(that.getView().getBusy()) {
								that.getView().setBusy(false);
							};
							MessageBox.success(that.getView().getModel("i18n").getProperty("Message.CheckPrSuccess"), {
								actions: [MessageBox.Action.CLOSE],
								onClose: function (oAction){
									if(oAction === "CLOSE"){
										
									};
								}
							});
						}else{
							var aDefer = [];
							aDefer.push(that.uploadFile(s.BANFN));
							$.when.apply($, aDefer).then(function (status) {
								that.prepareMessageCreateSuccess(status, s.BANFN, prType, isHold);
                                var wMsg = s.PrHeaderText.results.find(e => e.TDID === "W").TITLE;//++CH10
                                MessageBox.warning(wMsg);                                         //++CH10
							});
						}
					},
					error: function (e) {
						if(that.getView().getBusy()) {
							that.getView().setBusy(false);
						};
						that.errorHandlingCreate(e);
						setTimeout(function(){
							that.oMP.openBy(oButton);
						}.bind(that), 100);
					}
				});
			};
		},
		
		errorHandlingCreate: function (e) {
			var that = this;
			try {
					var loError = JSON.parse(e.responseText);
					if (loError.error.innererror.errordetails.length > 0) {
						var laMsg = jQuery.extend(true, {}, loError.error.innererror);
						that.convertErrorFormat(laMsg.errordetails);
						that.createErrorMessagePopover(laMsg.errordetails);
					} else {
						that._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: that.getView().getModel("i18n").getProperty("Message.ErrorText"),
								type: sap.ui.core.MessageType.Error,
								additionalText: that.getView().getModel("i18n").getProperty("Message.ErrorTitle")
							})
						);
					}
				} catch (err) {
					that._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: that.getView().getModel("i18n").getProperty("Message.ErrorText"),
							type: sap.ui.core.MessageType.Error,
							additionalText: that.getView().getModel("i18n").getProperty("Message.ErrorTitle")
						})
					);
				}
		},
		
		convertErrorFormat: function(arrErrors) {
			for (var i in arrErrors) {
				arrErrors[i].MESSAGE = arrErrors[i].message;
			}
		},
		
		deleteDuplicateRecords: function(arrErrors) {
			var errorList = [];
			var lvDuplicated;
			for (var i = 0; i < arrErrors.length; i++) {
				lvDuplicated = false;
				for (var j = 0; j < errorList.length; j++) {
					// Check duplicated message
					if (arrErrors[i]["MESSAGE"] == errorList[j]["MESSAGE"]) {
						lvDuplicated = true;
						break;
					}
				}
				if (!lvDuplicated) {
					errorList.push(arrErrors[i]);
				}
			}
			return errorList;
		},
		
		isHasData: function(input) {
			if (this.isNullOrBlank(input)) {
				return false;
			} else {
				return true;
			}
		},
		
		isNullOrBlank: function(e) {
			return "boolean" != typeof e && (!e || null == e || "" == e);
		},
		
		createErrorMessagePopover: function (arrErrors) {
			var lvArrError = this.deleteDuplicateRecords(arrErrors);
			var lvType;
			var lvCurrentType;
			var lvCode = "";
			var lvMsg = "";
			var lvTitle = "";
			var lvLastCode = "";
			for (var i = 0; i < lvArrError.length; i++) {
				// Skip technical errors
				if(!this.isHasData(lvArrError[i]["MESSAGE"]) || lvArrError[i]["code"] === "/IWBEP/CX_MGW_TECH_EXCEPTION" || lvArrError[i]["MESSAGE"] === "Return"){
					continue;
				}
				lvCurrentType = "";
				if(lvArrError[i]["severity"] === "warning"){
					lvCurrentType = sap.ui.core.MessageType.Warning;
				}else if(lvArrError[i]["severity"] === "info"){
					lvCurrentType = sap.ui.core.MessageType.Information;
				}else if(lvArrError[i]["severity"] === "success"){
					lvCurrentType = sap.ui.core.MessageType.Success;
				}else{
					lvCurrentType = sap.ui.core.MessageType.Error;
				}

				if(lvArrError[i]["code"][0] === "Z"){
					lvCode = lvArrError[i]["code"];
					// lvType = "Error";
					lvType = lvCurrentType;
					if(i !== 0 && lvLastCode !== lvArrError[i]["code"]){
						if(lvTitle === ""){
							lvTitle = lvArrError[i]["MESSAGE"];
							lvMsg = lvArrError[i]["MESSAGE"];
						}
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								code: "",
								message: lvTitle,
								type: lvType,
								additionalText: lvCode,
								description: lvMsg
							})
						);	
						lvCode = "";
						lvMsg = "";	
						lvTitle = "";				
					}else{
						if(lvTitle){
							
							if(lvMsg){
								lvMsg = lvMsg + "\r\n" + lvArrError[i]["MESSAGE"];
							}else{
								lvMsg = lvArrError[i]["MESSAGE"];
							}
						}else{
							lvTitle = lvArrError[i]["MESSAGE"];
						}
					};
					lvLastCode = lvArrError[i]["code"];
				}else{		
					
					if(lvTitle){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								code: "",
								message: lvTitle,
								type: lvType,
								additionalText: lvCode,
								description: lvMsg
							})
						);
					}
					lvCode = "";
					lvMsg = "";
					lvTitle = "";
					
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							code: "",
							message: lvArrError[i]["MESSAGE"],
							type: lvCurrentType,
							additionalText: lvArrError[i]["code"],
							description: lvArrError[i]["MESSAGE"]
						})
					);
				}	
			}
			
			if(lvTitle){
				this._MessageManager.addMessages(
					new sap.ui.core.message.Message({
						code: "",
						message: lvTitle,
						type: lvType,
						additionalText: lvCode,
						description: lvMsg
					})
				);
			}
			
			
			// this.getOwnerComponent().setModel(this._MessageManager.getMessageModel(),"message");
		},
		
		prepareMessageCreateSuccess: function(pStatus, pPr, prType, isHold){
			
			var that = this;
			var msg = "";
			var icon = "";
			var title = "";
			if (pStatus === "SUCCESS") {
				// msg = "บันทึกเอกสารสัญญาก่อสร้างเรียบร้อย";
				if(isHold){
					msg = that.getView().getModel("i18n").getResourceBundle().getText("Message.CreatePrHoldSuccess",[pPr]);
				}else{
					msg = that.getView().getModel("i18n").getResourceBundle().getText("Message.CreatePrSuccess",[pPr]);
				}
				icon = sap.m.MessageBox.Icon.SUCCESS;
				title = that.getView().getModel("i18n").getResourceBundle().getText("Message.SuccessTitle",[pPr]);
			} else {
				// msg = "บันทึกเอกสารสัญญาก่อสร้างเรียบร้อย แต่ไม่สามารถ Upload Attach File ได้";
				if(isHold){
					msg = that.getView().getModel("i18n").getResourceBundle().getText("Message.CreatePrHoldSuccesButAttachment",[pPr]);
				}else{
					msg = that.getView().getModel("i18n").getResourceBundle().getText("Message.CreatePrSuccesButAttachment",[pPr]);
				}
				icon = sap.m.MessageBox.Icon.WARNING;
				title = that.getView().getModel("i18n").getResourceBundle().getText("Message.WarningTitle",[pPr]);
			};
			var msgAssignPeoplePr = that.getView().getModel("i18n").getResourceBundle().getText("Button.AssignPeoplePr");
			
			var arrAction = []
			if(prType === "1A31"
                || prType === "1INT"){  //++CH11: Suraphan P.
				arrAction.push(msgAssignPeoplePr);
			}else{
				arrAction.push(msgAssignPeoplePr);
				arrAction.push(MessageBox.Action.CLOSE);
			}
			
			MessageBox.show(msg, {
				icon: icon,
				title: title,
				actions: arrAction,
				onClose: function (oAction){
					if(oAction === "CLOSE"){
						that.navToDisplay(pPr);
					}else{
						that.navToAssignPeople(pPr);
						that.navToDisplay(pPr);
					};
				}
			});
			
		},
		
		uploadFile: function (pPr) {

			var that = this;
			var serviceUrl = this.getView().getModel().sServiceUrl;
			var odataServiceModel = new sap.ui.model.odata.v2.ODataModel(serviceUrl);
			var defer = new $.Deferred();

			// var updCollection = that.getView().byId("idUploadCollection");
			var updCollection = that.getView().byId("idPrNewHeaderPage").getContent()[0].getSections()[3].getSubSections()[0].getBlocks()[0];
			that.aStackUploadDefer = [];
			that.aUploadItem = [];
			var serviceUrl = odataServiceModel.sServiceUrl + "/PrHeaderSet('" + pPr + "')/PrAttachMedia";
			
			// For upload
			for (var i = 0; i < updCollection._aFileUploadersForPendingUpload.length; i++) {
				updCollection._aFileUploadersForPendingUpload[i].setUploadUrl(serviceUrl);
				that.aStackUploadDefer.push(new $.Deferred());
			}
			
			// For Upload - Drag & Drop
			var upd = updCollection._oFileUploader;
			var file = updCollection._aFilesFromDragAndDropForPendingUpload;
			if(file.length > 0){
				upd.setUploadUrl(serviceUrl);
			}
			
			if(updCollection._aFileUploadersForPendingUpload.length > 0){
				updCollection.upload();
			}
			
			// For delete
			var deletedAttachmentData = this.C_MODEL.deletedAttachmentModel.getData();
			for (var i = 0; i < deletedAttachmentData.length; i++) {
				var obj = deletedAttachmentData[i];
				that.deleteUploadCollectionItem(obj.BANFN,obj.ARCHIV_ID,obj.ARCHIV_DOCID);
				that.aStackUploadDefer.push(new $.Deferred());
			}
			
			$.when.apply($, that.aStackUploadDefer).then(function() {
				
				updCollection._aFileUploadersForPendingUpload = [];
				
				var laToolBarContent = updCollection.getToolbar().mAggregations.content;
                if (laToolBarContent.length > 3) {
                    laToolBarContent.splice(3);
                }
				
				defer.resolve("SUCCESS");
				
			});	
			
			return defer;
		
		},
		
		deleteUploadCollectionItem: function (pr,archId,archDocId) {
			
			var that = this;
			var serviceUrl = that.getView().getModel().sServiceUrl;
			var odataServiceModel = new sap.ui.model.odata.v2.ODataModel(serviceUrl);
			
			var path = "/PrAttachMediaSet(BANFN='" + pr + "',ARCHIV_ID='" + archId + "',ARCHIV_DOCID='" + archDocId + "')/$value";
			
            odataServiceModel.remove(path, {
                success: function (s) {
                    var defer = that.aStackUploadDefer.pop();
					defer.resolve();
                },
                error: function(e){
                	var defer = that.aStackUploadDefer.pop();
					defer.resolve();
                }
            })
                
        },
		
		navToDisplay: function (pr) {
			return new Promise(function (fnResolve) {
				this.doNavigate("PrHeader", "", fnResolve, "", pr, "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});
		},
		
		validateDataForSave: function (isCheck) {
			
			// If test run, skip validate required fields
			if(isCheck){
				return true;
			}
			
			var that = this;
			var isSuccess = true;
			var oButton = this.getView().byId("messagePopoverBtn");
			
			// this._MessageManager = new sap.ui.core.message.MessageManager();
			// this.getView().setModel(this._MessageManager.getMessageModel(), "message");
			// this.createMessagePopover();
			
			//***** Register required fields *****
			// Document Type
			var document_type_control = this.getView().byId("idDocumentType");
			this.handleRequiredField(document_type_control,"input", this.getView().getModel("i18n").getResourceBundle().getText("Label.GeneralData"));
			
			// Page Item
			var prItem = this.C_MODEL.prItem.getData();

			for(var i=0;i<prItem.length;i++){
				
				// Item Short Text
				if(!prItem[i].TXZ01){
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
							code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
							type: sap.ui.core.MessageType.Error,
							additionalText: this.getView().getModel("i18n").getProperty("Label.ShortText"),
							description: this.getView().getModel("i18n").getProperty("Label.ShortText"),
							target: "/TXZ01",
							processor: ""
						})
					);
				}
				
				// Material Group
				if(!prItem[i].MATKL){
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
							code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
							type: sap.ui.core.MessageType.Error,
							additionalText: this.getView().getModel("i18n").getProperty("Label.MaterialGroup"),
							description: this.getView().getModel("i18n").getProperty("Label.MaterialGroup"),
							target: "/MATKL",
							processor: ""
						})
					);
				}
				
				// Purchasing Group
				if(!prItem[i].EKGRP){
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
							code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
							type: sap.ui.core.MessageType.Error,
							additionalText: this.getView().getModel("i18n").getProperty("Label.PurchasingGroup"),
							description: this.getView().getModel("i18n").getProperty("Label.PurchasingGroup"),
							target: "/EKGRP",
							processor: ""
						})
					);
				}
				
				// Plant
				if(!prItem[i].WERKS){
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
							code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
							type: sap.ui.core.MessageType.Error,
							additionalText: this.getView().getModel("i18n").getProperty("Label.Plant"),
							description: this.getView().getModel("i18n").getProperty("Label.Plant"),
							target: "/WERKS",
							processor: ""
						})
					);
				}
				
				// Item Qty
				if(parseFloat(prItem[i].MENGE) <= 0 || prItem[i].MENGE === null || prItem[i].MENGE === undefined || prItem[i].MENGE === ""){
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
							code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
							type: sap.ui.core.MessageType.Error,
							additionalText: this.getView().getModel("i18n").getProperty("Label.Quantity"),
							description: this.getView().getModel("i18n").getProperty("Label.Quantity"),
							target: "/MENGE",
							processor: ""
						})
					);
				}
				
				// Item Qty Unit
				if (!prItem[i].MEINS_NAME) {
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
							code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO, 0)),
							type: sap.ui.core.MessageType.Error,
							additionalText: this.getView().getModel("i18n").getProperty("Label.Unit"),
							description: this.getView().getModel("i18n").getProperty("Label.Unit"),
							target: "/MEINS_NAME",
							processor: ""
						})
					);
				}
				
				// Unit Price
				if(prItem[i].LOEKZ === ""){
					if(parseFloat(prItem[i].PREIS) <= 0 || prItem[i].PREIS === null || prItem[i].PREIS === undefined || prItem[i].PREIS === ""){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.UnitPrice"),
								description: this.getView().getModel("i18n").getProperty("Label.UnitPrice"),
								target: "/PREIS",
								processor: ""
							})
						);
					}
				}
				
				// Price Unit
				if(parseFloat(prItem[i].PEINH) <= 0 || prItem[i].PEINH === null || prItem[i].PEINH === undefined || prItem[i].PEINH === ""){
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
							code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
							type: sap.ui.core.MessageType.Error,
							additionalText: this.getView().getModel("i18n").getProperty("Label.PriceUnit"),
							description: this.getView().getModel("i18n").getProperty("Label.PriceUnit"),
							target: "/PEINH",
							processor: ""
						})
					);
				}
				
				// Delivery Date
				if(!prItem[i].LFDAT || prItem[i].LFDAT === null){
					this._MessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
							code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
							type: sap.ui.core.MessageType.Error,
							additionalText: this.getView().getModel("i18n").getProperty("Label.DeliveryDate"),
							description: this.getView().getModel("i18n").getProperty("Label.DeliveryDate"),
							target: "/LFDAT",
							processor: ""
						})
					);
				}
				
				if(prItem[i].PSTYP === "D" || prItem[i].PSTYP === "9"){
					// Sum Limit
					if(!prItem[i].NOLIMIT){
						if(parseFloat(prItem[i].SUMLIMIT) <= 0 || prItem[i].SUMLIMIT === null || prItem[i].SUMLIMIT === undefined || prItem[i].SUMLIMIT === ""){
							this._MessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
									code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
									type: sap.ui.core.MessageType.Error,
									additionalText: this.getView().getModel("i18n").getProperty("Label.SumLimit"),
									description: this.getView().getModel("i18n").getProperty("Label.SumLimit"),
									target: "/SUMLIMIT",
									processor: ""
								})
							);
						}
					}
					
					// Expect Limit
					if(parseFloat(prItem[i].COMMITMENT) <= 0 || prItem[i].COMMITMENT === null || prItem[i].COMMITMENT === undefined || prItem[i].COMMITMENT === ""){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.ExpectLimit"),
								description: this.getView().getModel("i18n").getProperty("Label.ExpectLimit"),
								target: "/COMMITMENT",
								processor: ""
							})
						);
					}
				}
				
				if(prItem[i].KNTTP === "" || prItem[i].KNTTP === "-"){
					
					// Functional Area
					if(!prItem[i].FKBER){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.FunctionalArea"),
								description: this.getView().getModel("i18n").getProperty("Label.FunctionalArea"),
								target: "/FKBER",
								processor: ""
							})
						);
					}
					
					// Fund Center
					if(!prItem[i].FISTL){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.FundCenter"),
								description: this.getView().getModel("i18n").getProperty("Label.FundCenter"),
								target: "/FISTL",
								processor: ""
							})
						);
					}
					
					// Valuation Type
					if(prItem[i].MATNR && !prItem[i].BWTAR){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.ValType"),
								description: this.getView().getModel("i18n").getProperty("Label.ValType"),
								target: "/BWTAR",
								processor: ""
							})
						);
					}
					
				}else if(prItem[i].KNTTP === "K"){
					
					// GL
					if(!prItem[i].PrAccAssignment.results[0].SAKTO){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.GlAccount"),
								description: this.getView().getModel("i18n").getProperty("Label.GlAccount"),
								target: "/SAKTO",
								processor: ""
							})
						);
					}
					
					// Business Area
					if(!prItem[i].PrAccAssignment.results[0].GSBER){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.BusinessArea"),
								description: this.getView().getModel("i18n").getProperty("Label.BusinessArea"),
								target: "/GSBER",
								processor: ""
							})
						);
					}
				
					// Cost Center
					if(!prItem[i].PrAccAssignment.results[0].KOSTL){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.CostCenter"),
								description: this.getView().getModel("i18n").getProperty("Label.CostCenter"),
								target: "/KOSTL",
								processor: ""
							})
						);
					}
					
					// Fund
					if(!prItem[i].PrAccAssignment.results[0].GEBER){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.Fund"),
								description: this.getView().getModel("i18n").getProperty("Label.Fund"),
								target: "/GEBER",
								processor: ""
							})
						);
					}
					
					// Functional Area
					if(!prItem[i].PrAccAssignment.results[0].FKBER){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: this.getView().getModel("i18n").getResourceBundle().getText("Label.ItemList") + " " + ("" + parseInt(prItem[i].BNFPO,0)),
								type: sap.ui.core.MessageType.Error,
								additionalText: this.getView().getModel("i18n").getProperty("Label.FunctionalArea"),
								description: this.getView().getModel("i18n").getProperty("Label.FunctionalArea"),
								target: "/FKBER",
								processor: ""
							})
						);
					}

				}
				
			}
			
			var message = this._MessageManager.getMessageModel().getData();
			if(message.length > 0){
				setTimeout(function(){
					this.oMP.openBy(oButton);
				}.bind(this), 100);
				return false;
			}else{
				return true;	
			}
			
		},
		
		convertUndefinedValue: function(object){
			
			for (var key in object) {
				if (object.hasOwnProperty(key)) {
					if(object[key] === undefined){
						object[key] = "";
					}
				}
			}
			
			return object;
			
		},
		
		createDataForSave: function (isHold,isCheck) {

			var userLogin = sap.ushell.Container.getService("UserInfo").getId();
			var prHeaderData = $.extend({}, this.C_MODEL.prHeader.getData());
			var prItemData = $.extend([], this.C_MODEL.prItem.getData());
			var prHeaderTextData = $.extend([], this.C_MODEL.prHeaderText.getData());
			var prItem = [];
			var prHeaderText = [];
			
			// PR header text
			for (var i = 0; i < prHeaderTextData.length; i++) {
				var hdTextData = $.extend({}, prHeaderTextData[i]);
				var hdText = {};
				hdText.BANFN = "";
				hdText.TDID = hdTextData.TDID;
				hdText.DETAIL = hdTextData.DETAIL;
				prHeaderText.push(hdText);
			}

			// PR item data
			for (var i = 0; i < prItemData.length; i++) {

				var it = $.extend({}, prItemData[i]);

				var record = {};
				it = this.convertUndefinedValue(it);
				record.BANFN = "";
				record.BNFPO = "" + it.BNFPO;
				record.MATNR = it.MATNR;
				record.TXZ01 = it.TXZ01;
				record.MATKL = it.MATKL;
				record.EKGRP = it.EKGRP;
				record.LIFNR = it.LIFNR;
				record.AFNAM = it.AFNAM;      
				record.ZZMMEGP_PROJ = it.ZZMMEGP_PROJ;
				record.ZZMMEGP_ITEM = it.ZZMMEGP_ITEM;
				record.ZZMMEGP_YEAR = it.ZZMMEGP_YEAR;
				record.ZZMM_FISTL = it.ZZMM_FISTL;
				record.ZZMM_GEBER = it.ZZMM_GEBER;
				record.BEDNR = it.BEDNR;
				record.WERKS = it.WERKS;
				record.LGORT = it.LGORT;
				record.KNTTP = it.KNTTP;
				
				if(prHeaderData.ZZMM_NO_ESIGN){
					record.ZZMM_NO_ESIGN = prHeaderData.ZZMM_NO_ESIGN;	
				}else{
					record.ZZMM_NO_ESIGN = false;
				}
				
				record.PSTYP = it.PSTYP;
				if(it.PSTYP === 'D'){
					record.PSTYP = 'D';
					record.COMMITMENT = "" + it.COMMITMENT;
					record.SUMLIMIT = "" + it.SUMLIMIT;
					if(it.NOLIMIT){
						record.NOLIMIT = 'X';
					}else{
						record.NOLIMIT = '';
					}
				}
				
				record.MENGE = "" + it.MENGE;
				record.MEINS = it.MEINS;
				record.PREIS = "" + it.PREIS;
				record.PEINH = "" + it.PEINH;
				record.RLWRT = "" + it.RLWRT;
				record.WAERS = it.WAERS;
				record.LFDAT = it.LFDAT;
				record.IDNLF = it.IDNLF;
				
				if(it.LOEKZ){
					record.LOEKZ = 'X';
				}else{
					record.LOEKZ = '';
				}
				
				if(record.OLD){
					delete record.OLD;
				}
				
				record.PrAccAssignment = [];
				if(record.KNTTP === "" || record.KNTTP === "-"){
					record.KNTTP = "";
					record.GEBER = it.GEBER;
					record.FKBER = it.FKBER;
					record.FISTL = it.FISTL;
					record.FIPOS = it.FIPOS;
					record.KBLNR = it.KBLNR;
					record.KBLPOS = it.KBLPOS;
					record.BWTAR = it.BWTAR;
				}else{
					
					if(prItemData[i].PrAccAssignment.results){
						
						for(var j=0;j<prItemData[i].PrAccAssignment.results.length;j++){
							
							var itAcc = $.extend({}, prItemData[i].PrAccAssignment.results[j]);
							itAcc = this.convertUndefinedValue(itAcc);
							var recordAcc = {};
							recordAcc.BANFN = "";
							// recordAcc.BNFPO = "" + itAcc.BNFPO;
							recordAcc.BNFPO = "" + it.BNFPO;
							recordAcc.ZEBKN = itAcc.ZEBKN;
							recordAcc.SAKTO = itAcc.SAKTO;
							recordAcc.GSBER = itAcc.GSBER;
							recordAcc.KOKRS = itAcc.KOKRS;
							recordAcc.KOSTL = itAcc.KOSTL;
							recordAcc.AUFNR = itAcc.AUFNR;
							recordAcc.GEBER = itAcc.GEBER;
							recordAcc.FKBER = itAcc.FKBER;
							recordAcc.FISTL = itAcc.FISTL;
							recordAcc.FIPOS = itAcc.FIPOS;
							recordAcc.KBLNR = itAcc.KBLNR;
							recordAcc.KBLPOS = itAcc.KBLPOS;
							recordAcc.ANLKL = itAcc.ANLKL;
							recordAcc.ORD41 = itAcc.ORD41;
							recordAcc.GDLGRP = itAcc.GDLGRP;
							recordAcc.ANLN1_NAME = itAcc.ANLN1_NAME;
							recordAcc.MEINS = itAcc.MEINS;
							recordAcc.ZANLKL = itAcc.ZANLKL;
							recordAcc.ZANLKL2 = itAcc.ZANLKL2;
							recordAcc.NDJAR = itAcc.NDJAR;
							recordAcc.NDPER = itAcc.NDPER;
							recordAcc.SCHRW_PROZ = itAcc.SCHRW_PROZ;
							if(recordAcc.SCHRW_PROZ){
								recordAcc.SCHRW_PROZ = "" + recordAcc.SCHRW_PROZ;	
							}else{
								recordAcc.SCHRW_PROZ = "0";
							}
							
							recordAcc.AFASL = itAcc.AFASL;
							recordAcc.AUFNR = itAcc.AUFNR;
							
							recordAcc.GSBER = itAcc.GSBER;
							if(itAcc.ANLN1 === "NEW"){
								recordAcc.ANLN1 = "";
							}else{
								recordAcc.ANLN1 = itAcc.ANLN1;
							}
							recordAcc.ANLN2 = itAcc.ANLN2;
							
							if(!itAcc.MENGE){
								itAcc.MENGE = 0;
							}
							recordAcc.MENGE = "" + itAcc.MENGE;
							
							recordAcc = this.convertUndefinedValue(recordAcc);
							record.PrAccAssignment.push(recordAcc);
						
						}
						
					}
					
				}
				
				record.PrItemText = [];
				if(prItemData[i].PrItemText.results){
						
					for(var j=0;j<prItemData[i].PrItemText.results.length;j++){
						
						var itText = $.extend({}, prItemData[i].PrItemText.results[j]);
						itText = this.convertUndefinedValue(itText);
						var recordText = {};
						recordText.BANFN = "";
						// recordText.BNFPO = "" + itText.BNFPO;
						recordText.BNFPO = "" + it.BNFPO;
						recordText.TDID = itText.TDID;
						recordText.DETAIL = itText.DETAIL;
						
						recordText = this.convertUndefinedValue(recordText);
						record.PrItemText.push(recordText);
					
					}
					
				}
				
				record = this.convertUndefinedValue(record);
				prItem.push(record);

			};

			// PR header data
			var prHeader = {};
			prHeader.BANFN = "";
			prHeader.BSART = prHeaderData.BSART;
			// prHeader.REQ_NR = prHeaderData.REQ_NR;
			prHeader.MEMORY = false;
			if(isHold){
				prHeader.MEMORY = true;
			}
			prHeader.TEST_RUN = false;
			if(isCheck){
				prHeader.TEST_RUN = true;
			}
			
			// Associations
			prHeader.PrItem = prItem;
			prHeader.PrHeaderText = prHeaderText;
			
			prHeader = GUtilities.AdjustDateTimeDataToSend(prHeader);
			return prHeader;

		},
		
		getCurrentMaxItemNumber: function(){
			
			var prItem = this.C_MODEL.prItem.getData();
			var currentItem = 0;
			for(var i=0;i<prItem.length;i++){
				if(parseInt(prItem[i].BNFPO) > currentItem){
					currentItem = parseInt(prItem[i].BNFPO);
				}
			}
			
			return currentItem;
			
		},
		
		handleCopyItem: function(oEvent){
			var that = this;
			var prItemModel = that.C_MODEL.prItem;
			var prItemData = prItemModel.getData();
			var list = oEvent.getSource().getParent().getParent();
			var selectedData = list.getSelectedItems();
			var currentItem = that.getCurrentMaxItemNumber();
			if(selectedData.length === 0){
				var bCompact = !!that.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error( that.getView().getModel("i18n").getProperty("Message.Selected1Line"),
					{ styleClass: bCompact ? "sapUiSizeCompact" : "" }
				);
				return;
			};
			if(list.getBusy() === false){
				list.setBusyIndicatorDelay(0);
				list.setBusy(true);
			}
			setTimeout(function(){
				for(var i=0;i<selectedData.length;i++){
					let recordData = JSON.parse(JSON.stringify(selectedData[i].getBindingContext("prItem").getObject()));
					recordData.LFDAT = selectedData[i].getBindingContext("prItem").getObject().LFDAT;
					currentItem = currentItem + 10;
					if(recordData.PrItemText.results){
						recordData.BNFPO = "" + currentItem;
						
						var arr = recordData.PrItemText.results;
						for(var j=0;j<arr.length;j++){
							arr[j].BNFPO = "" + currentItem;
						}
						
						var arr = recordData.PrAccAssignment.results;
						for(var k=0;k<arr.length;k++){
							arr[k].BNFPO = "" + currentItem;
						}
						
						prItemData.push(recordData);
					}
				}
				
				prItemModel.setData([]);
				prItemModel.setSizeLimit(prItemData.length); //++CH04-3
				prItemModel.setData(prItemData);
				that.C_MODEL.prItem.updateBindings();
				if (list.getBusy() === true) {
					list.setBusy(false);
				}
			}, 500);
		},
		
		getPrItemData: function (pr) {
			var that = this;
			var serviceUrl = this.oView.getModel().sServiceUrl;
			var srvModel = new sap.ui.model.odata.v2.ODataModel(serviceUrl);
			var prHeaderModel = this.C_MODEL.prHeader;
			var prItemModel = this.C_MODEL.prItem;
			var prItemData = prItemModel.getData();
			// Prepare filters
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("BANFN","EQ",pr,""));
			var path = "/PrItemSet";
			srvModel.read(path, {
				filters: aFilters,
				urlParameters: {
					"$expand": "PrItemText,PrAccAssignment"
				},
				success: function (s) {
					for(var i=0;i<s.results.length;i++){
						var it = $.extend({}, s.results[i] );
						it.BANFN = "NEW";
						it.OLD = false;
						it.LOEKZ = "";
						it.PURCH_DOC = "";
						it.ZZMMEGP_YEAR = "";
						it.ZZMMEGP_ITEM = "";
						it.ZZMMEGP_PROJ = "";
						
						if(it.NOLIMIT){
							it.NOLIMIT = true;
						}else{
							it.NOLIMIT = false;
						}
						
						for(var j=0;j<it.PrItemText.results.length;j++){
							it.PrItemText.results[j].BANFN = "NEW";
							
							if(it.PrItemText.results[j].TDID === "B06"){
								it.PrItemText.results[j].DETAIL = "";
							}
							
						}
						
						if(it.KNTTP === ""){
							it.KNTTP_NAME = that.getView().getModel("i18n").getProperty("Label.AccountAssignment.None");
						}
						
						if(it.KNTTP !== "A"){
							for(var k=0;k<it.PrAccAssignment.results.length;k++){
								it.PrAccAssignment.results[k].BANFN = "NEW";
							}	
						}else{
							it.PrAccAssignment.results = [];
						}
						
						if(it.PSTYP === '9'){
							it.PSTYP = 'D';
						}
						
						for (var j = 0; j < it.PrItemText.results.length; j++) {
							if (it.PrItemText.results[j].TDID === "B20") {
								if (it.PrItemText.results[j].DETAIL !== "") {
									it.VAT_OLD = parseFloat(it.PrItemText.results[j].DETAIL, 0);
								} else {
									it.VAT_OLD = 0;
								}
								break;
							}
						}
						
						prItemModel.setProperty("/" + i, it)
					}
					that.C_MODEL.prItem.updateBindings();
					
					// Copy no print e-signature from first item
					if(s.results.length > 0){
						prHeaderModel.setProperty("/ZZMM_NO_ESIGN",s.results[0].ZZMM_NO_ESIGN);
					}
					
					that._showFormFragment("PrNewHeader");
					that.createMessagePopover();
					that.onAfterShowView();
					
					if (that.getView().getBusy() === true) {
						that.getView().setBusy(false);
					}
				},
				error: function (pError) {
					
					that._showFormFragment("PrNewHeader");
					that.onAfterShowView();
				
					if (that.getView().getBusy() === true) {
						that.getView().setBusy(false);
					}
				}
			});
		},
		
		navToAssignPeople: function(pr){
			
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					// shellHash: "ZFIORI-ZLPUBA104_NAV?sap-ui-tech-hint=GUI&sap-language=TH&PR=" + pr 
					shellHash: "ZFIORI-ZLPUBA104_NAV&/Page1/" + pr 
				}
			}));
			var url = window.location.href.split('#')[0] + hash;
			sap.m.URLHelper.redirect(url, true);
			
		},
		
		handleAddItem: function(oEvent){
			this.isInit = false;
			var currentItem = this.getCurrentMaxItemNumber();
			var newItemNumber = currentItem + 10;
			var pr = "NEW";
			return new Promise(function (fnResolve) {
				this.doNavigate("PrNewItem", "", fnResolve, "", pr, newItemNumber);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});
		},
		
		handleDeleteItem: function(oEvent){
			var that = this;
			var list = oEvent.getSource().getParent().getParent();
			var selectedData = list.getSelectedItems();
			
			if(selectedData.length === 0){
				var bCompact = !!that.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error( that.getView().getModel("i18n").getProperty("Message.Selected1Line"),
					{ styleClass: bCompact ? "sapUiSizeCompact" : "" }
				);
				return;
			};
			
			// for(var i=0;i<selectedData.length;i++){
			// 	var recordData = selectedData[i].getBindingContext("prItem").getObject();
			// 	if(!recordData.LOEKZ){
			// 		recordData.LOEKZ = true;
			// 	}
			// }
			
			var prItemModel = this.C_MODEL.prItem;
			var prItemData = $.extend([],prItemModel.getData());
			for(var i=0;i<selectedData.length;i++){
				var itemNumber = selectedData[i].getBindingContext("prItem").getObject().BNFPO;
				var idx = that.findIndexPr(itemNumber,prItemData);
				prItemData.splice(idx, 1);
			}
			
			// Re-run index number
			for(var i=0;i<prItemData.length;i++){
				prItemData[i].BNFPO = (i + 1) * 10;
				
				for(var j=0;j<prItemData[i].PrItemText.results.length;j++){
					prItemData[i].PrItemText.results[j].BNFPO = (i + 1) * 10;
				}
				
				for(var k=0;k<prItemData[i].PrAccAssignment.results.length;k++){
					prItemData[i].PrAccAssignment.results[k].BNFPO = (i + 1) * 10;
				}
						
			}
			
			that.C_MODEL.prItem.setData([]);
			that.C_MODEL.prItem.setData(prItemData);
			that.C_MODEL.prItem.updateBindings();
			list.removeSelections();
			
		},
		
		findIndexPr: function(itemNumber,prItemData){
			var idx = -1;
			for(var i=0;i<prItemData.length;i++){
				if(prItemData[i].BNFPO === itemNumber){
					idx = i;
				}
			}
			return idx;
		},
		
		handleUnDeleteItem: function(oEvent){
			var that = this;
			var list = oEvent.getSource().getParent().getParent();
			var selectedData = list.getSelectedItems();
			
			if(selectedData.length === 0){
				var bCompact = !!that.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error( that.getView().getModel("i18n").getProperty("Message.Selected1Line"),
					{ styleClass: bCompact ? "sapUiSizeCompact" : "" }
				);
				return;
			};
			
			for(var i=0;i<selectedData.length;i++){
				var recordData = selectedData[i].getBindingContext("prItem").getObject();
				if(recordData.LOEKZ){
					recordData.LOEKZ = '';
				}
			}
			that.C_MODEL.prItem.updateBindings();
			list.removeSelections();
		}
	
	});
}, /* bExport= */ true);