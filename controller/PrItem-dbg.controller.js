sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"../utilities/Formatter",
	"iam/bc/utilities/CommonVHDialog",
	"iam/bc/utilities/Utilities"
], function (BaseController, MessageBox, History, Formatter, CommonVHDialog, GUtilities) {
	"use strict";

	return BaseController.extend("com.cu.s4hana.zlpuba001.controller.PrItem", {
		
		formatter: Formatter,
		C_MODEL_NAME: {
			prItem: "prItem",
			prItemDetail: "prItemDetail",
			prItemText: "prItemText",
			prAccountAssignment: "prAccountAssignment",
			prNewAsset: "prNewAsset",
			errorsAsset: "errorsAsset",
			f4Material: "f4Material",
			f4Vendor: "f4Vendor"
		},
		
		C_MODEL: {
			prItem: null,
			prItemDetail: null,
			prItemText: null,
			prAccountAssignment: null,
			prNewAsset: null,
			errorsAsset: null,
			f4Material: null,
			f4Vendor: null
		},
		
		_formFragments: {},
		
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("PrItem").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			
			this._MessageManager = new sap.ui.core.message.MessageManager();
			 this.getView().setModel(this._MessageManager.getMessageModel(), "message");
			
			this.getView().addEventDelegate({
	             onAfterShow : jQuery.proxy(function(evt) {
	                  this.onAfterShow(evt);
	             }, this)
	         });
			
		},
		
		createMessagePopover: function () {
			var that = this;
			this.oMP = new sap.m.MessagePopover({
				activeTitlePress: function (oEvent) {
					var oItem = oEvent.getParameter("item"),
						oPage = that.oView.byId("idPrItemPage"),
						oMessage = oItem.getBindingContext("message").getObject(),
						oControl = sap.ui.getCore().byId(oMessage.getControlId());
						// oControl = that.getView().byId("formContainer").getItems()[0].getFormContainers()[0].getFormElements()[0].getFields()[0];

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
		
		getGroupName : function (code) {
			if (code) {
				// var sFormSubtitle = oControl.getParent().getParent().getTitle().getText(),
				// 	sFormTitle = oControl.getParent().getParent().getParent().getTitle();
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
		
		initModel: function() {
			
			// var prItemModel = new sap.ui.model.json.JSONModel();
			// this.getOwnerComponent().setModel(prItemModel, this.C_MODEL_NAME.prItem);
			// this.C_MODEL.prItem = prItemModel;
			
			var prItemDetailModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(prItemDetailModel, this.C_MODEL_NAME.prItemDetail);
			this.C_MODEL.prItemDetail = prItemDetailModel;
			
			var prItemTextModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(prItemTextModel, this.C_MODEL_NAME.prItemText);
			this.C_MODEL.prItemText = prItemTextModel;
			
			var prAccountAssignmentModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(prAccountAssignmentModel, this.C_MODEL_NAME.prAccountAssignment);
			this.C_MODEL.prAccountAssignment = prAccountAssignmentModel;
			
			var prNewAssetModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(prNewAssetModel, this.C_MODEL_NAME.prNewAsset);
			this.C_MODEL.prNewAsset = prNewAssetModel;
			
			var errorsAssetModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(errorsAssetModel, this.C_MODEL_NAME.errorsAsset);
			this.C_MODEL.errorsAsset = errorsAssetModel;
			
			var f4MaterialModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(f4MaterialModel, this.C_MODEL_NAME.f4Material);
			this.C_MODEL.f4Material = f4MaterialModel;
			
			var f4VendorModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(f4VendorModel, this.C_MODEL_NAME.f4Vendor);
			this.C_MODEL.f4Vendor = f4VendorModel;
			
		},
		
		handleRouteMatched: function (oEvent) {
			
			// Get parameters
			if (oEvent.getParameters().data) {
				var pr = oEvent.getParameters().data.Pr;
				var prItem = oEvent.getParameters().data.PrItem;
			}
			
			// Check PR item already retrieved
			this.initModel();
			var IsExisting = this.checkIsExisting(pr,prItem);
			
			// Check if PR Item already initiated from PR Header Page
			// Otherwise -> Initial PR Item model and retrieve data from backend
			if(IsExisting){
				this.syncData(pr,prItem);
				this.getMasterData();
			}else{
				this.getData(pr,prItem);
			}
			
			// Check mode already initiated from PR Header Page
			var controlModel = this.getOwnerComponent().getModel("controlModel");
			var vMode = "Display";
			if(controlModel && controlModel.getData().mode === "EDIT"){
				vMode = "Edit";
			}
			this._showFormFragment(vMode);
			this.initSelectControl(prItem);
			
		},
		
		prepareRefDoc: function(){
			var that = this;
			//<BOI CH03
			var lv_meins = this.C_MODEL.prItemDetail.getProperty("/MEINS_NAME"); 
			var lv_meins_tmp = this.C_MODEL.prItemDetail.getProperty("/MEINS_TMP"); 
			if ( lv_meins_tmp == null ){
				this.C_MODEL.prItemDetail.setProperty("/MEINS_TMP",lv_meins); 
			}
			//>EOI CH03
			var data = this.C_MODEL.prItemDetail.getData();
			var form = this.getView().byId("idPrItemPage").getContent()[0].getSections()[0].getSubSections()[0].getBlocks()[0].getContent()[0];
			var control = form.getFormContainers()[2].getFormElements()[4].getFields()[0];
			control.removeAllItems();
			
			if(data.PURCH_DOC !== ""){
				var refDoc = data.PURCH_DOC;
				var arrDoc = refDoc.split(",");
				for(var i=0;i<arrDoc.length;i++){
					var arrKey = arrDoc[i].trim().split(" / ");
					var link = new sap.m.Link({text: arrDoc[i], href: that.formatter.parseRefDocLink(arrKey[0],arrKey[1]), target: "_blank"});
					control.addItem(link);
				}
			}else{
				var link = new sap.m.Link({text: "-", href: "", enabled: false});
				control.addItem(link);
			}
			
		},
		
		syncMessagePopover: function(prItem){
			
			var messageModel = this.getOwnerComponent().getModel("errors");
			var messageData = $.extend([],messageModel.getData());
			var prItemDetail = this.C_MODEL.prItemDetail.getData();
			
			this._MessageManager = new sap.ui.core.message.MessageManager();
	        this.getView().setModel(this._MessageManager.getMessageModel(),"message");
	        this.createMessagePopover();
	        
			for(var i=0;i<messageData.length;i++){
				var items = messageData[i].code.split(" ");
				if(parseInt(items[1],0) === parseInt(prItem,0)){
					var target = "";
					var controlId = "";
					var processor = "";
					switch (messageData[i].target) {
						case "/TXZ01":
							target = this.getView().byId("idItemShortText").getBindingPath("value");
							controlId = this.getView().byId("idItemShortText").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/MATKL":
							target = this.getView().byId("idMaterialGroup").getBindingPath("value");
							controlId = this.getView().byId("idMaterialGroup").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/EKGRP":
							target = this.getView().byId("idPurchasingGroup").getBindingPath("value");
							controlId = this.getView().byId("idPurchasingGroup").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/WERKS":
							target = this.getView().byId("idPlant").getBindingPath("value");
							controlId = this.getView().byId("idPlant").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/SUMLIMIT":
							target = this.getView().byId("idSumLimit").getBindingPath("value");
							controlId = this.getView().byId("idSumLimit").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/COMMITMENT":
							target = this.getView().byId("idExpectLimit").getBindingPath("value");
							controlId = this.getView().byId("idExpectLimit").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/MENGE":
							target = this.getView().byId("idQuantity").getBindingPath("value");
							controlId = this.getView().byId("idQuantity").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/MEINS_NAME":
							target = this.getView().byId("idUnit").getBindingPath("value");
							controlId = this.getView().byId("idUnit").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/PREIS":
							target = this.getView().byId("idUnitPrice").getBindingPath("value");
							controlId = this.getView().byId("idUnitPrice").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/PEINH":
							target = this.getView().byId("idPriceUnit").getBindingPath("value");
							controlId = this.getView().byId("idPriceUnit").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/BWTAR":
							target = this.getView().byId("idValType").getBindingPath("value");
							controlId = this.getView().byId("idValType").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/LFDAT":
							target = this.getView().byId("idDeliveryDate").getBindingPath("dateValue");
							controlId = this.getView().byId("idDeliveryDate").getId();
							processor = this.getView().getModel("prItemDetail");
							break;
						case "/SAKTO":  //บัญชี G/L
							target = this.getView().byId("idGlAccountK").getBindingPath("value");
							controlId = this.getView().byId("idGlAccountK").getId();
							processor = this.getView().getModel("prAccountAssignment");
							break;
						case "/GSBER":  //ประเภทธุรกิจ
							target = this.getView().byId("idBusinessAreaK").getBindingPath("value");
							controlId = this.getView().byId("idBusinessAreaK").getId();
							processor = this.getView().getModel("prAccountAssignment");
							break;
						case "/KOSTL": //ศูนย์ต้นทุน
							target = this.getView().byId("idCostCenterK").getBindingPath("value");
							controlId = this.getView().byId("idCostCenterK").getId();
							processor = this.getView().getModel("prAccountAssignment");
							break;
						case "/GEBER":  //เงินทุน
							if(prItemDetail.KNTTP === "" || prItemDetail.KNTTP === "-"){
								target = this.getView().byId("idFund").getBindingPath("value");
								controlId = this.getView().byId("idFund").getId();
								processor = this.getView().getModel("prItemDetail");
							}else{
								target = this.getView().byId("idFundK").getBindingPath("value");
								controlId = this.getView().byId("idFundK").getId();
								processor = this.getView().getModel("prAccountAssignment");
							}
							break;
						case "/FKBER":  //ขอบเขตตามหน้าที่
							if(prItemDetail.KNTTP === "" || prItemDetail.KNTTP === "-"){
								target = this.getView().byId("idFunctionalArea").getBindingPath("value");
								controlId = this.getView().byId("idFunctionalArea").getId();
								processor = this.getView().getModel("prItemDetail");
							}else{
								target = this.getView().byId("idFunctionalAreaK").getBindingPath("value");
								controlId = this.getView().byId("idFunctionalAreaK").getId();
								processor = this.getView().getModel("prAccountAssignment");
							}
							break;
						case "/FISTL":  //ศูนย์เงินทุน
							if(prItemDetail.KNTTP === "" || prItemDetail.KNTTP === "-"){
								target = this.getView().byId("idFundCenter").getBindingPath("value");
								controlId = this.getView().byId("idFundCenter").getId();
								processor = this.getView().getModel("prItemDetail");
							}else{
								target = this.getView().byId("idFundCenterK").getBindingPath("value");
								controlId = this.getView().byId("idFundCenterK").getId();
								processor = this.getView().getModel("prAccountAssignment");
							}
							break;
						default:
						
					}
					if(target){
						this._MessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getView().getModel("i18n").getProperty("Message.RequiredField"),
								code: messageData[i].code,
								type: sap.ui.core.MessageType.Error,
								additionalText: messageData[i].additionalText,
								description: messageData[i].description,
								target: target,
								processor: processor,
								controlId: controlId
							})
						);
					}
				}else{
					this._MessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: messageData[i].message,
						code: messageData[i].code,
						type: messageData[i].type,
						additionalText: messageData[i].additionalText,
						description: messageData[i].description,
						target: messageData[i].target,
						processor: ""
					})
				);
				}
			}
			
			var msg = this._MessageManager.getMessageModel().getData();
			function mycomparator(a,b) {
				if ( a.id < b.id )
			        return -1;
			    if ( a.id > b.id )
			        return 1;
			}
			msg.sort(mycomparator);
			this._MessageManager.getMessageModel().updateBindings();
			
		},
		
		handleMessagePopoverPress: function (oEvent) {
			this.oMP = null;
			if (!this.oMP) {
				this.createMessagePopover();
			}
			this.oMP.toggle(oEvent.getSource());
		},
		
		getMasterData: function(){
		
			var that = this;
			var aDefer = [];
			if (that.getView().getBusy() === false) {
				that.getView().setBusyIndicatorDelay(0);
				that.getView().setBusy(true);
			}
			aDefer.push(that.getF4MaterialData());
			aDefer.push(that.getF4VendorData());
			$.when.apply($, aDefer).then(function (status) {
				if (that.getView().getBusy() === true) {
					that.getView().setBusy(false);
				}
			});
			
		},
		
		initSelectControl: function(prItem){
			if(this.getOwnerComponent().getModel("prItem")){
				this.getView().byId("idSelectItem").setVisible(true);
				this.getView().byId("idSelectItem").setSelectedKey(prItem);
				this.getView().byId("idGoToNextItem").setVisible(true);
				this.getView().byId("idGoToPreviousItem").setVisible(true);
			}else{
				this.getView().byId("idSelectItem").setVisible(false);
				this.getView().byId("idGoToNextItem").setVisible(false);
				this.getView().byId("idGoToPreviousItem").setVisible(false);
			}
		},
		
		checkIsExisting: function(pPr,pPrItem){
			var prItem = this.getOwnerComponent().getModel("prItem");
			var isExisting = false;
			if(pPr === "NEW"){
				isExisting = true;
			}else{
				var prItemData = [];
				if(prItem){
					prItemData = prItem.getData();
				}
				for(var i=0;i<prItemData.length;i++){
					// if(parseInt(prItemData[i].BNFPO) === parseInt(pPrItem) && parseInt(prItemData[i].BANFN) === parseInt(pPr)){
					if(parseInt(prItemData[i].BNFPO) === parseInt(pPrItem)){
						if(prItemData[i].PrItemText.results && prItemData[i].PrAccAssignment.results){
							isExisting = true;
						}
					}
				}
			}
			return isExisting;
		},
		
		syncData: function(pPr,pPrItem){
			
			var that = this;
			var prItemDetail = that.C_MODEL.prItemDetail;
			var prItemText = that.C_MODEL.prItemText;
			var prAccountAssignment = that.C_MODEL.prAccountAssignment;
			var prItemData = that.getOwnerComponent().getModel("prItem").getProperty("/");
			
			// Set busy indicator
			if (that.getView().getBusy() === false) {
				that.getView().setBusyIndicatorDelay(0);
				that.getView().setBusy(true);
			}
			
			setTimeout(function(){
				for(var i=0;i<prItemData.length;i++){
					// if(parseInt(prItemData[i].BNFPO,0) === parseInt(pPrItem,0) && parseInt(prItemData[i].BANFN,0) === parseInt(pPr,0)){
					if(parseInt(prItemData[i].BNFPO,0) === parseInt(pPrItem,0)){
						if(prItemData[i].KNTTP === ''){
							prItemData[i].KNTTP = '-';
						}
						prItemDetail.setData(prItemData[i]);
						prItemText.setData(prItemData[i].PrItemText.results);
						prAccountAssignment.setData(prItemData[i].PrAccAssignment.results);
					}
				}
				
				prItemDetail.updateBindings();
				prItemText.updateBindings();
				prAccountAssignment.updateBindings();
				
				if (that.getView().getBusy() === true) {
					that.getView().setBusy(false);
				}
				
				if(that.getOwnerComponent().getModel("errors").getData().length > 0){
					that.syncMessagePopover(prItemDetail.getData().BNFPO);
					var oButton = that.getView().byId("messagePopoverBtn");
					setTimeout(function(){
						that.oMP.openBy(oButton);
					}.bind(that), 100);
				}
				
				that.prepareRefDoc();
				
			}, 500);
			
		},
		
		getDataIndex: function(pPr,pPrItem){
			var prItemData = this.getOwnerComponent().getModel("prItem").getProperty("/");
			var vIndex = -1;
			for(var i=0;i<prItemData.length;i++){
				if(parseInt(prItemData[i].BNFPO,0) === parseInt(pPrItem,0) && parseInt(prItemData[i].BANFN,0) === parseInt(pPr,0)){
					vIndex = i;
				}
			}
			return vIndex;
		},
		
		handleChangeAccountAssignment: function(oEvent){
			var selectedKey = oEvent.getParameters().selectedItem.getKey();
			var selecedText = oEvent.getParameters().selectedItem.getText();
			
			this.C_MODEL.prItemDetail.setProperty("/KNTTP", selectedKey);
			this.C_MODEL.prItemDetail.setProperty("/KNTTP_NAME", selecedText);
			
			if(selectedKey === "K"){
				var plant = "";
				var plantName = "";
				var userParamModel = this.getOwnerComponent().getModel("userParam");
				if(userParamModel){
					var param = userParamModel.getData();
					plant = param.WERKS;
					plantName = param.NAME1;
				}else{
					plant = this.C_MODEL.prItemDetail.getProperty("/WERKS");
					plantName = this.C_MODEL.prItemDetail.getProperty("/WERKS_NAME");
				}
				
				var temp = [];
				temp.push({ZEBKN:"1", GSBER:plant, GSBER_NAME:plantName, KOKRS:"1000", KOKRS_NAME:"เขตการควบคุมจุฬาฯ"});
				// temp.push({"ZEBKN":"1","KOKRS":"1000","KOKRS_NAME":"เขตการควบคุมจุฬาฯ"});
				this.C_MODEL.prAccountAssignment.setProperty("/",temp);
				this.C_MODEL.prItemDetail.setProperty("/KNTTP_NAME", this.getView().getModel("i18n").getProperty("Label.AccountAssignment.CostCenter"));
				this.C_MODEL.prItemDetail.setProperty("/PrAccAssignment/results",this.C_MODEL.prAccountAssignment.getData());
			}else if(selectedKey === "A"){
				this.C_MODEL.prAccountAssignment.setProperty("/",[]);
				this.C_MODEL.prItemDetail.setProperty("/KNTTP_NAME", this.getView().getModel("i18n").getProperty("Label.AccountAssignment.Asset"));
				this.C_MODEL.prItemDetail.setProperty("/PrAccAssignment/results",this.C_MODEL.prAccountAssignment.getData())
			}else if(selectedKey === "U"){
				this.C_MODEL.prAccountAssignment.setProperty("/",[]);
				this.C_MODEL.prItemDetail.setProperty("/KNTTP_NAME", this.getView().getModel("i18n").getProperty("Label.AccountAssignment.Unknown"));
			}else{
				this.C_MODEL.prItemDetail.setProperty("/GEBER", "");
				this.C_MODEL.prItemDetail.setProperty("/GEBER_NAME", "");
				this.C_MODEL.prItemDetail.setProperty("/FKBER", "");
				this.C_MODEL.prItemDetail.setProperty("/FKBER_NAME", "");
				this.C_MODEL.prItemDetail.setProperty("/FISTL", "");
				this.C_MODEL.prItemDetail.setProperty("/FISTL_NAME", "");
				this.C_MODEL.prItemDetail.setProperty("/FIPOS", "");
				this.C_MODEL.prItemDetail.setProperty("/FIPOS_NAME", "");
				this.C_MODEL.prItemDetail.setProperty("/KBLNR", "");
				this.C_MODEL.prItemDetail.setProperty("/KBLPOS", "");
				this.C_MODEL.prItemDetail.setProperty("/KNTTP_NAME", this.getView().getModel("i18n").getProperty("Label.AccountAssignment.None"));
			}
			
			this.updateModelBindings();
		},
		
		handleChangeItemCategory: function(oEvent){
			var selectedKey = oEvent.getParameters().selectedItem.getKey();
			if(selectedKey === "D"){
				this.C_MODEL.prItemDetail.setProperty("/SUMLIMIT", this.C_MODEL.prItemDetail.getProperty("/PREIS"));
				this.C_MODEL.prItemDetail.setProperty("/COMMITMENT", this.C_MODEL.prItemDetail.getProperty("/PREIS"));
				this.C_MODEL.prItemDetail.setProperty("/NOLIMIT", false);
				this.C_MODEL.prItemDetail.setProperty("/MENGE", "1");
				this.C_MODEL.prItemDetail.setProperty("/MEINS", "AU");
				this.C_MODEL.prItemDetail.setProperty("/MEINS_NAME", this.getView().getModel("i18n").getProperty("Label.ActivityUnit"));
			}else{
				this.C_MODEL.prItemDetail.setProperty("/SUMLIMIT", 0);
				this.C_MODEL.prItemDetail.setProperty("/COMMITMENT", 0);
				this.C_MODEL.prItemDetail.setProperty("/NOLIMIT", false);
				this.C_MODEL.prItemDetail.setProperty("/MEINS_NAME", this.C_MODEL.prItemDetail.getProperty("/MEINS_TMP"));//++CH03
				// this.C_MODEL.prItemDetail.setProperty("/MENGE", "");
				// this.C_MODEL.prItemDetail.setProperty("/MEINS", "");
				// this.C_MODEL.prItemDetail.setProperty("/MEINS_NAME", "");
			}
			this.C_MODEL.prItemDetail.updateBindings();
		},
		
		updateModelBindings: function(){
			this.C_MODEL.prItemDetail.updateBindings();
			this.C_MODEL.prItemText.updateBindings();
			this.C_MODEL.prAccountAssignment.updateBindings();
			this.C_MODEL.prNewAsset.updateBindings();
		},
		
		getData: function (pPr, pPrItem) {
			var that = this;
			var aDefer = [];
			if (that.getView().getBusy() === false) {
				that.getView().setBusyIndicatorDelay(0);
				that.getView().setBusy(true);
			}
			aDefer.push(that.getPrItemData(pPr,pPrItem));
			aDefer.push(that.getF4MaterialData());
			aDefer.push(that.getF4VendorData());
			aDefer.push(that.getDefaultControlArea());
			$.when.apply($, aDefer).then(function (status) {
				that.updateData(pPr,pPrItem);
				that.prepareRefDoc();
				if (that.getView().getBusy() === true) {
					that.getView().setBusy(false);
				}
			});
		},
		
		updateData: function(pPr,pPrItem){
			
			var prItemDetail = this.C_MODEL.prItemDetail;
			
			if(this.getOwnerComponent().getModel("prItem")){
				var vIndex = this.getDataIndex(pPr,pPrItem);
				this.getOwnerComponent().getModel("prItem").setProperty("/" + vIndex, prItemDetail.getData())
			}
			
		},
		
		getPrItemData: function (pPr,pPrItem) {

			var that = this;
			var srvModel = this.getView().getModel();
			// var prHeader = this.C_MODEL.prHeader;
			var prItemDetail = this.C_MODEL.prItemDetail;
			var prItemText = this.C_MODEL.prItemText;
			var prAccountAssignment = this.C_MODEL.prAccountAssignment;
			var defer = new $.Deferred();

			var path = "/PrItemSet(BANFN='" + pPr + "',BNFPO='" + pPrItem + "')";

			srvModel.read(path, {

				urlParameters: {
					"$expand": "PrItemText,PrAccAssignment"
				},

				success: function (s) {

					// Pr Item Data
					var it = $.extend({}, s);

					if (it.LFDAT) it.LFDAT.setHours(0);
					it.BANFN = parseInt(it.BANFN,0);
					it.BNFPO = parseInt(it.BNFPO,0);
					
					// hd.AdvPer = that.util.formatValue(hd.AdvPer);
					// hd.RetPer = that.util.formatValue(hd.RetPer);
					
					// if(it.LOEKZ){
					// 	it.LOEKZ = 1;
					// }else{
					// 	it.LOEKZ = 0;
					// }
					
					if(it.NOLIMIT === ''){
						it.NOLIMIT = false;
					}else{
						it.NOLIMIT = true;
					}
					
					it.ZZMMEGP_ITEM = "" + parseInt(it.ZZMMEGP_ITEM); 

					prItemDetail.setData({});
					prItemDetail.setData(it);

					for (var i = 0; i < s.PrAccAssignment.results.length; i++) {
						s.PrAccAssignment.results[i].BANFN = parseInt(s.PrAccAssignment.results[i].BANFN,0);
						s.PrAccAssignment.results[i].BNFPO = parseInt(s.PrAccAssignment.results[i].BNFPO,0);
						// s.PrAccAssignment.results[i].ZEKBN = parseInt(s.PrAccAssignment.results[i].ZEKBN,0);
					}

					// PR Item Account Assignment Data
					prAccountAssignment.setData([]);
					prAccountAssignment.setData(s.PrAccAssignment.results);
					
					// PR Item Text Data
					prItemText.setData([]);
					prItemText.setData(s.PrItemText.results);
				
					defer.resolve();

				},

				error: function (pError) {

					defer.resolve();
					// that.errorHandlingRead(pError);
				}

			});

			return defer;

		},
		
		getDefaultControlArea: function () {
			var that = this;
			var srvModel = this.getView().getModel();
			var prAccountAssignment = this.C_MODEL.prAccountAssignment;
			var defer = new $.Deferred();
			var path = "/F4ControlAreaSet('1000')";
			srvModel.read(path, {
				success: function (s) {
					prAccountAssignment.setProperty("/0/KOKRS", s.KOKRS);
					prAccountAssignment.setProperty("/0/KOKRS_NAME", s.BEZEI);
					// that.getView().byId("idControllingAreaK").setValue(s.KOKRS);
					defer.resolve();
				},
				error: function (pError) {
					defer.resolve();
				}
			});
			return defer;
		},
		
		getF4MaterialData: function () {
			var srvModel = this.getView().getModel();
			var f4Material = this.C_MODEL.f4Material;
			var defer = new $.Deferred();
			var path = "/F4MaterialSet";
			srvModel.read(path, {
				success: function (s) {
					f4Material.setData([]);
					f4Material.setData(s.results);
					defer.resolve();
				},
				error: function (pError) {
					defer.resolve();
				}
			});
			return defer;
		},
		
		getF4VendorData: function () {
			var srvModel = this.getView().getModel();
			var f4Vendor = this.C_MODEL.f4Vendor;
			var defer = new $.Deferred();
			var path = "/F4VendorSet";
			srvModel.read(path, {
				success: function (s) {
					f4Vendor.setData([]);
					f4Vendor.setData(s.results);
					defer.resolve();
				},
				error: function (pError) {
					defer.resolve();
				}
			});
			return defer;
		},
		
		handleBackPress: function () {
			this.destroyFragment();
			this.syncErrorMessages();
			this.doNavBack();
		},
		
		destroyFragment : function () {
			// for (var sPropertyName in this._formFragments) {
			// 	if (!this._formFragments.hasOwnProperty(sPropertyName) || this._formFragments[sPropertyName] === null) {
			// 		return;
			// 	}

			// 	this._formFragments[sPropertyName].destroy();
			// 	this._formFragments[sPropertyName] = null;
			// }
		},
		
		onTextBoxLiveChange: function (oEvent) {
            // debugger;
            GUtilities.formatTextArea(oEvent, 120);
        },

		handleChangeLongText: function(oEvent){
			
			var control = oEvent.getSource();
			
			// Calculate Vat Amount
			var prItem = this.getOwnerComponent().getModel("prItem");
			var prItemData = prItem.getData();
			var input = control.getValue();
			var amountBeforeVat = 0;
			var newVat = 0, newVatAmount = 0, amountIncVat = 0;
			var context = control.getBindingInfo("value").binding.getContext().getObject();
			
			if(context.TDID === "B20"){
				
				if(!control.getBusy()){
					control.setBusyIndicatorDelay(0);
					control.setBusy(true);
				}
				
				if(input === "" || isNaN(input)){
					input = "";
					newVat = "0";
					amountBeforeVat = "";
				}else{
					newVat = input;
				}
				
				for(var i=0;i<prItemData.length;i++){
					var rec = $.extend({},prItemData[i]);	
					amountBeforeVat = parseFloat(rec.PREIS,0);
					if(rec.VAT_OLD){
						amountBeforeVat = (amountBeforeVat * 100) / ( 100 + rec.VAT_OLD);
					}
					newVatAmount = amountBeforeVat * parseFloat(newVat,0) / 100;
					amountIncVat = amountBeforeVat + newVatAmount;
					prItem.setProperty("/" + i + "/VAT_OLD", parseFloat(newVat,0));
					prItem.setProperty("/" + i + "/PREIS", "" + amountIncVat);
					prItem.setProperty("/" + i + "/RLWRT", "" + (amountIncVat * parseFloat(rec.MENGE,0)) );
					
					// For service document
					if(rec.PSTYP === "D"){
						prItem.setProperty("/" + i + "/COMMITMENT", "" + amountIncVat);
					}
					
					// Update this VAT to all items text
					for(var j=0;j<prItemData[i].PrItemText.results.length;j++){
						if(prItemData[i].PrItemText.results[j].TDID === "B20"){
							prItem.setProperty("/" + i + "/PrItemText/results/" + j + "/DETAIL", input);
							// break;
						}else if(prItemData[i].PrItemText.results[j].TDID === "B21"){
							if(input === ""){
								amountBeforeVat = "";
							}
							prItem.setProperty("/" + i + "/PrItemText/results/" + j + "/DETAIL", amountBeforeVat.toLocaleString(undefined, {minimumFractionDigits: 2}) );
							// break;
						}
					}
					
				}
				
				prItem.updateBindings();
				this.C_MODEL.prItemDetail.updateBindings();
				
				if(control.getBusy()){
					control.setBusy(false);
				}
				
			}
			
		},
		
		selectedSuggestMaterial: function(oEvent){
			var selectedMatDesc = oEvent.getParameters().selectedRow.getBindingContext("f4Material").getObject().MAKTX;
			this.C_MODEL.prItemDetail.setProperty("/TXZ01", selectedMatDesc);
		},
		
		selectedSuggestVendor: function(oEvent){
			var selectedVendorDesc = oEvent.getParameters().selectedRow.getBindingContext("f4Vendor").getObject().NAME1;
			this.C_MODEL.prItemDetail.setProperty("/LIFNR_NAME", selectedVendorDesc);
		},
		
		_getFormFragment: function (sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];

			if (oFormFragment) {
				return oFormFragment;
			}

			oFormFragment = sap.ui.xmlfragment(this.getView().getId(), "com.cu.s4hana.zlpuba001.view.fragment.PrItem" + sFragmentName, this);
			this.getView().addDependent(oFormFragment);
			
			this._formFragments[sFragmentName] = oFormFragment;
			return this._formFragments[sFragmentName];
		},

		_showFormFragment : function (sFragmentName) {
			var oPage = this.byId("idPrItemPage");

			oPage.removeAllContent();
			oPage.insertContent(this._getFormFragment(sFragmentName));
		},		
		
		getQueryParameters: function (oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},
		
		handleItemChange: function (oEvent) {
			
			var Pr = this.C_MODEL.prItemDetail.getData().BANFN;
			var PrItem = parseInt(oEvent.getParameters().selectedItem.getKey(),0);
			
			this.syncErrorMessages();

			return new Promise(function (fnResolve) {
				this.doNavigate("PrItem", "", fnResolve, "", Pr, PrItem);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		
		handleGoToNextItem: function(){
			
			var pr = this.C_MODEL.prItemDetail.getData().BANFN;
			var currentPrItem = this.C_MODEL.prItemDetail.getData().BNFPO;
			var prItemData = this.getOwnerComponent().getModel("prItem").getData();
			var currentIndex = -1;
			var nextIndex = -1;
			
			for(var i=0;i<prItemData.length;i++){
				if(parseInt(currentPrItem,0) === parseInt(prItemData[i].BNFPO,0)){
					currentIndex = i;
					break;
				}
			}
			
			if((currentIndex + 1) === prItemData.length){
				nextIndex = 0;
			}else{
				nextIndex = currentIndex + 1;
			}
			
			var nextPrItem = prItemData[nextIndex].BNFPO;
			
			this.syncErrorMessages();
			
			return new Promise(function (fnResolve) {
				this.doNavigate("PrItem", "", fnResolve, "", pr, nextPrItem);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});
			
		},
		
		handleGoToPreviousItem: function(){
			
			var pr = this.C_MODEL.prItemDetail.getData().BANFN;
			var currentPrItem = this.C_MODEL.prItemDetail.getData().BNFPO;
			var prItemData = this.getOwnerComponent().getModel("prItem").getData();
			var currentIndex = -1;
			var prevIndex = -1;
			
			for(var i=0;i<prItemData.length;i++){
				if(parseInt(currentPrItem,0) === parseInt(prItemData[i].BNFPO,0)){
					currentIndex = i;
					break;
				}
			}
			
			if(currentIndex === 0){
				prevIndex = prItemData.length - 1;
			}else{
				prevIndex = currentIndex - 1;
			}
			
			var nextPrItem = prItemData[prevIndex].BNFPO;
			
			this.syncErrorMessages();
			
			return new Promise(function (fnResolve) {
				this.doNavigate("PrItem", "", fnResolve, "", pr, nextPrItem);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});
			
		},
		
		doNavBack: function (oEvent) {
			
			var Pr = this.C_MODEL.prItemDetail.getData().BANFN;
			var page = "PrHeader";
			if(Pr === "NEW"){
				page = "PrNewHeader";
			}
			return new Promise(function (fnResolve) {
				this.doNavigate(page, "", fnResolve, "", Pr, "");
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
			
			if(this.getOwnerComponent().getModel("errors")){
				this.getOwnerComponent().getModel("errors").setData([]);
				this.getOwnerComponent().getModel("errors").setData(arr);
				this.getOwnerComponent().getModel("errors").updateBindings();
			}
			
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
					case "PrItem":
						this.oRouter.navTo(sRouteName, {
							Pr: Pr,
							PrItem: PrItem
						});
						break;
					case "PrHeader":
						this.oRouter.navTo(sRouteName, {
							Pr: Pr
						});
						break;
					case "PrNewHeader":
						this.oRouter.navTo(sRouteName);
						break;
					default:
				}
				
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		
		onVHMaterial: function (oEvent) {

			var that = this;
			var model = this.C_MODEL.prItemDetail;
			
			var prNo = model.getProperty("/BANFN");
			var egpNo = model.getProperty("/ZZMMEGP_PROJ");
			var egpItem = model.getProperty("/ZZMMEGP_ITEM");
			var prEgpData = that.getOwnerComponent().getModel("prEgpData").getData();
			var aFilters = [];
			var defaultGroes = "";
			if(prNo = "NEW" && egpNo && egpItem && prEgpData){
				var index = parseInt(egpItem) - 1;
				// defaultGroes = prEgpData.EGPWS0007.product[index].field2;					//--CH02
				defaultGroes = prEgpData.EGPWS0007.product[index].field2.substring(0,6);		//++CH02
				aFilters.push(new sap.ui.model.Filter("GROES","EQ",defaultGroes,""));
			};
			
			var index = model.getData();
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Material"),
				key: "MATNR",
				descriptionKey: "MAKTX",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "MATNR",
					label: this.getView().getModel("i18n").getProperty("Label.Material")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.MATNR = pSelected.MATNR;
                    	index.TXZ01 = pSelected.MAKTX;
                    	model.updateBindings();
                    	that.onChangeMaterial(index.MATNR);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.Material"),
                        template: "MATNR",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.MaterialName"),
                        template: "MAKTX",
                        demandPopin: true
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.SizeDimension"),
                        template: "GROES",
                        demandPopin: true
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4MaterialSet",
					filters: aFilters
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "MATNR",
                        label: this.getView().getModel("i18n").getProperty("Label.Material"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "MAKTX",
                        label: this.getView().getModel("i18n").getProperty("Label.MaterialName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "GROES",
                        label: this.getView().getModel("i18n").getProperty("Label.SizeDimension"),
                        control: new sap.m.Input({value:defaultGroes}),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
			loVHDialog.getProperty("ValueHelpDialogParameters").datas.filters= [];
		
		},
		
		onChangeMaterial: function () {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prItemDetail = that.C_MODEL.prItemDetail;
			var material = prItemDetail.getProperty("/MATNR");

			if (!material) {
				prItemDetail.setProperty("/MATNR", "");
				prItemDetail.setProperty("/TXZ01", "");
				prItemDetail.setProperty("/BWTAR", "");
				prItemDetail.setProperty("/BWTAR_NAME", "");
				prItemDetail.setProperty("/MATKL", "");
				prItemDetail.setProperty("/MATKL_NAME", "");
				prItemDetail.setProperty("/MEINS", "");
				prItemDetail.setProperty("/MEINS_NAME", "");
				return;
			}

			var path = "/MatInfoSet('" + material + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prItemDetail.setProperty("/TXZ01", s.MAKTX);
					prItemDetail.setProperty("/MATKL", s.MATKL);
					prItemDetail.setProperty("/MATKL_NAME", s.WGBEZ);
					prItemDetail.setProperty("/MEINS", s.MEINS);
					prItemDetail.setProperty("/MEINS_NAME", s.MSEHL);
					prItemDetail.setProperty("/MEINS_TMP",s.MSEHL); //++CH03
					
					prItemDetail.updateBindings();

				},

				error: function (pError) {
					
					prItemDetail.setProperty("/MATNR", "");
					prItemDetail.setProperty("/TXZ01", "");
					prItemDetail.setProperty("/BWTAR", "");
					prItemDetail.setProperty("/BWTAR_NAME", "");
					prItemDetail.setProperty("/MATKL", "");
					prItemDetail.setProperty("/MATKL_NAME", "");
					prItemDetail.setProperty("/MEINS", "");
					prItemDetail.setProperty("/MEINS_NAME", "");
					prItemDetail.setProperty("/MEINS_TMP",""); //++CH03
					
					prItemDetail.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHMaterialGroup: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var model = this.C_MODEL.prItemDetail;
			var index = model.getData();
			var mService = that.getOwnerComponent().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.MaterialGroup"),
				key: "MATKL",
				descriptionKey: "WGBEZ",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "MATKL",
					label: this.getView().getModel("i18n").getProperty("Label.MaterialGroup")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.MATKL = pSelected.MATKL;
                    	index.MATKL_NAME = pSelected.WGBEZ;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.MaterialGroup"),
                        template: "MATKL",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.MaterialGroupName"),
                        template: "WGBEZ",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4MatGroupSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "MATKL",
                        label: this.getView().getModel("i18n").getProperty("Label.MaterialGroup"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "WGBEZ",
                        label: this.getView().getModel("i18n").getProperty("Label.MaterialGroupName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeMaterialGroup: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prItemDetail = that.C_MODEL.prItemDetail;
			var materialGroup = prItemDetail.getProperty("/MATKL");
			var sTarget = oEvent.getSource().getBindingPath("value");
			
			if (!materialGroup) {
				prItemDetail.setProperty("/MATKL", "");
				prItemDetail.setProperty("/MATKL_NAME", "");
				return;
			}

			var path = "/F4MatGroupSet('" + materialGroup + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prItemDetail.setProperty("/MATKL_NAME", s.WGBEZ);
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					prItemDetail.setProperty("/MATKL", "");
					prItemDetail.setProperty("/MATKL_NAME", "");

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHPurchasingGroup: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var model = this.C_MODEL.prItemDetail;
			var index = model.getData();
			var mService = that.getOwnerComponent().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.PurchasingGroup"),
				key: "EKGRP",
				descriptionKey: "EKNAM",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "EKGRP",
					label: this.getView().getModel("i18n").getProperty("Label.PurchasingGroup")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.EKGRP = pSelected.EKGRP;
                    	index.EKGRP_NAME = pSelected.EKNAM;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.PurchasingGroup"),
                        template: "EKGRP",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.PurchasingGroupName"),
                        template: "EKNAM",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4PurGroupSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "EKGRP",
                        label: this.getView().getModel("i18n").getProperty("Label.PurchasingGroup"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "EKNAM",
                        label: this.getView().getModel("i18n").getProperty("Label.PurchasingGroupName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		changeMessageModel: function(sTarget){
			this.removeMessageFromTarget(sTarget);
		},
		
		removeMessageFromTarget: function (sTarget) {
			this._MessageManager.getMessageModel().getData().forEach(function(oMessage){
				if (oMessage.target === sTarget) {
					this._MessageManager.removeMessages(oMessage);
				}
			}.bind(this));
		},
		
		onChangeItemShortText: function(oEvent){
			var sTarget = oEvent.getSource().getBindingPath("value");
			if(oEvent.getSource().getValue()){
				this.changeMessageModel(sTarget);
			}
		},
		
		onChangePurchasingGroup: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prItemDetail = that.C_MODEL.prItemDetail;
			var purchasingGroup = prItemDetail.getProperty("/EKGRP");
			var sTarget = oEvent.getSource().getBindingPath("value");
			
			if (!purchasingGroup) {
				prItemDetail.setProperty("/EKGRP", "");
				prItemDetail.setProperty("/EKGRP_NAME", "");
				return;
			}

			var path = "/F4PurGroupSet('" + purchasingGroup + "')";

			srvModel.read(path, {

				success: function (s) {
					prItemDetail.setProperty("/EKGRP", s.EKGRP);
					prItemDetail.setProperty("/EKGRP_NAME", s.EKNAM);
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					prItemDetail.setProperty("/EKGRP", "");
					prItemDetail.setProperty("/EKGRP_NAME", "");

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHVendor: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var model = this.C_MODEL.prItemDetail;
			var index = model.getData();
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Vendor"),
				key: "LIFNR",
				descriptionKey: "NAME1",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "LIFNR",
					label: this.getView().getModel("i18n").getProperty("Label.Vendor")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.LIFNR = pSelected.LIFNR;
                    	index.LIFNR_NAME = pSelected.NAME1;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.Vendor"),
                        template: "LIFNR",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.VendorName"),
                        template: "NAME1",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4VendorSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "LIFNR",
                        label: this.getView().getModel("i18n").getProperty("Label.Vendor"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "NAME1",
                        label: this.getView().getModel("i18n").getProperty("Label.VendorName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeVendor: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prItemDetail = that.C_MODEL.prItemDetail;
			var vendor = prItemDetail.getProperty("/LIFNR");

			if (!vendor) {
				prItemDetail.setProperty("/LIFNR", "");
				prItemDetail.setProperty("/LIFNR_NAME", "");
				return;
			}

			var path = "/F4VendorSet('" + vendor + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prItemDetail.setProperty("/LIFNR_NAME", s.NAME1);

				},

				error: function (pError) {
					
					prItemDetail.setProperty("/LIFNR", "");
					prItemDetail.setProperty("/LIFNR_NAME", "");

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHValType: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var model = this.C_MODEL.prItemDetail;
			var index = model.getData();
			
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("MATNR","EQ",index.MATNR,""));
			aFilters.push(new sap.ui.model.Filter("BWKEY","EQ",index.WERKS,""));
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.ValType"),
				key: "BWTAR",
				descriptionKey: "DESCR",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "BWTAR",
					label: this.getView().getModel("i18n").getProperty("Label.ValType")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.BWTAR = pSelected.BWTAR;
                    	index.BWTAR_NAME = pSelected.DESCR;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.ValType"),
                        template: "BWTAR",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.Description"),
                        template: "DESCR",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4ValTypeSet",
					filters: aFilters
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BWTAR",
                        label: this.getView().getModel("i18n").getProperty("Label.ValType"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "DESCR",
                        label: this.getView().getModel("i18n").getProperty("Label.Description"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeValType: function (oEvent) {

			var that = this;
			var srvModel = that.getView().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var prItemDetail = that.C_MODEL.prItemDetail;
			var valType = prItemDetail.getProperty("/BWTAR");
			var material = prItemDetail.getProperty("/MATNR");
			var plant = prItemDetail.getProperty("/WERKS");

			if (!valType) {
				prItemDetail.setProperty("/BWTAR", "");
				prItemDetail.setProperty("/BWTAR_NAME", "");
				return;
			}

			var path = "/F4ValTypeSet(MATNR='" + material + "',BWKEY='" + plant + "',BWTAR='" + valType + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prItemDetail.setProperty("/BWTAR_NAME", s.DESCR);
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					prItemDetail.setProperty("/BWTAR", "");
					prItemDetail.setProperty("/BWTAR_NAME", "");

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHPlant: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var model = this.C_MODEL.prItemDetail;
			var index = model.getData();
			var mService = that.getOwnerComponent().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
			
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Plant"),
				key: "WERKS",
				descriptionKey: "NAME1",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "WERKS",
					label: this.getView().getModel("i18n").getProperty("Label.Plant")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.WERKS = pSelected.WERKS;
                    	index.WERKS_NAME = pSelected.NAME1;
                    	
                    	if(index.KNTTP === 'K'){
                    		that.C_MODEL.prAccountAssignment.setProperty("/0/GSBER",index.WERKS);
                    		that.C_MODEL.prAccountAssignment.setProperty("/0/GSBER_NAME",index.WERKS_NAME);
                    		that.C_MODEL.prAccountAssignment.updateBindings();
                    	}
                    	
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.Plant"),
                        template: "WERKS",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.PlantName"),
                        template: "NAME1",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4PlantSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "WERKS",
                        label: this.getView().getModel("i18n").getProperty("Label.Plant"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "NAME1",
                        label: this.getView().getModel("i18n").getProperty("Label.PlantName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangePlant: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prItemDetail = that.C_MODEL.prItemDetail;
			var plant = prItemDetail.getProperty("/WERKS");
			var sTarget = oEvent.getSource().getBindingPath("value");
			
			if (!plant) {
				prItemDetail.setProperty("/WERKS", "");
				prItemDetail.setProperty("/WERKS_NAME", "");
				prItemDetail.setProperty("/LGORT", "");
				prItemDetail.setProperty("/LGORT_NAME", "");
				prItemDetail.setProperty("/BWTAR", "");
				prItemDetail.setProperty("/BWTAR_NAME", "");
				
				if(prItemDetail.getProperty("/KNTTP") === 'K'){
            		this.C_MODEL.prAccountAssignment.setProperty("/0/GSBER","");
            		this.C_MODEL.prAccountAssignment.setProperty("/0/GSBER_NAME","");
            		this.C_MODEL.prAccountAssignment.updateBindings();
            	}
				
				return;
			}

			var path = "/F4PlantSet('" + plant + "')";

			srvModel.read(path, {

				success: function (s) {
					prItemDetail.setProperty("/WERKS", s.WERKS);
					prItemDetail.setProperty("/WERKS_NAME", s.NAME1);
					
					if(prItemDetail.getProperty("/KNTTP") === 'K'){
	            		that.C_MODEL.prAccountAssignment.setProperty("/0/GSBER",s.WERKS);
	            		that.C_MODEL.prAccountAssignment.setProperty("/0/GSBER_NAME", s.NAME1);
	            		that.C_MODEL.prAccountAssignment.updateBindings();
	            	}
            	
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					prItemDetail.setProperty("/WERKS", "");
					prItemDetail.setProperty("/WERKS_NAME", "");
					
					if(prItemDetail.getProperty("/KNTTP") === 'K'){
	            		that.C_MODEL.prAccountAssignment.setProperty("/0/GSBER","");
	            		that.C_MODEL.prAccountAssignment.setProperty("/0/GSBER_NAME","");
	            		that.C_MODEL.prAccountAssignment.updateBindings();
	            	}

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHSloc: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			
			var plant = this.C_MODEL.prItemDetail.getProperty("/WERKS");
			
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("WERKS","EQ",plant,""));
			
			var model = this.C_MODEL.prItemDetail;
			var index = model.getData();
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.StorageLocation"),
				key: "LGORT",
				descriptionKey: "LGOBE",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "LGORT",
					label: this.getView().getModel("i18n").getProperty("Label.StorageLocation")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
						index.WERKS = pSelected.WERKS;
                    	index.LGORT = pSelected.LGORT;
                    	index.LGORT_NAME = pSelected.LGOBE;
                    	model.updateBindings();
                    	that.onChangePlant();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
					// {
     //                   label: this.getView().getModel("i18n").getProperty("Label.Plant"),
     //                   template: "WERKS",
     //                   demandPopin: false
     //               },
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.StorageLocation"),
                        template: "LGORT",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.StorageLocationName"),
                        template: "LGOBE",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4SlocSet",
					filters: aFilters
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    // {
                    //     groupTitle: "",
                    //     groupName: "group1",
                    //     name: "WERKS",
                    //     label: this.getView().getModel("i18n").getProperty("Label.Plant"),
                    //     control: new sap.m.Input(),
                    //     operation: sap.ui.model.FilterOperator.NE
                    // },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "LGORT",
                        label: this.getView().getModel("i18n").getProperty("Label.StorageLocation"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "LGOBE",
                        label: this.getView().getModel("i18n").getProperty("Label.StorageLocationName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeSloc: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prItemDetail = that.C_MODEL.prItemDetail;
			var plant = prItemDetail.getProperty("/WERKS");
			var sloc = prItemDetail.getProperty("/LGORT");

			if (!sloc) {
				prItemDetail.setProperty("/LGORT", "");
				prItemDetail.setProperty("/LGORT_NAME", "");
				return;
			}

			var path = "/F4SlocSet(WERKS='" + plant + "',LGORT='" + sloc + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prItemDetail.setProperty("/LGORT_NAME", s.LGOBE);

				},

				error: function (pError) {
					
					prItemDetail.setProperty("/LGORT", "");
					prItemDetail.setProperty("/LGORT_NAME", "");

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHControllingArea: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.ControllingArea"),
				key: "KOKRS",
				descriptionKey: "BEZEI",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "KOKRS",
					label: this.getView().getModel("i18n").getProperty("Label.ControllingArea")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.KOKRS = pSelected.KOKRS;
                    	index.KOKRS_NAME = pSelected.BEZEI;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.ControllingArea"),
                        template: "KOKRS",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.ControllingAreaName"),
                        template: "BEZEI",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4ControlAreaSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "KOKRS",
                        label: this.getView().getModel("i18n").getProperty("Label.ControllingArea"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BEZEI",
                        label: this.getView().getModel("i18n").getProperty("Label.ControllingAreaName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeControllingArea: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var controlArea = oEvent.getSource().getValue();

			if (!controlArea) {
				// prItemDetail.setProperty("/KOKRS", "");
				// prItemDetail.setProperty("/KOKRS_NAME", "");
				index.KOKRS = "";
				index.KOKRS_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4ControlAreaSet('" + controlArea + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/KOKRS_NAME", s.BEZEI);
					index.KOKRS_NAME = s.BEZEI;
					model.updateBindings();
					that.changeMessageModel(sTarget);
					
				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/KOKRS", "");
					// prItemDetail.setProperty("/KOKRS_NAME", "");
					index.KOKRS = "";
					index.KOKRS_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHCostCenter: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.CostCenter"),
				key: "KOSTL",
				descriptionKey: "KTEXT",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "KOSTL",
					label: this.getView().getModel("i18n").getProperty("Label.CostCenter")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.KOSTL = pSelected.KOSTL;
                    	index.KOSTL_NAME = pSelected.KTEXT;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.CostCenter"),
                        template: "KOSTL",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.CostCenterName"),
                        template: "KTEXT",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4CostCenterSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "KOSTL",
                        label: this.getView().getModel("i18n").getProperty("Label.CostCenter"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "KTEXT",
                        label: this.getView().getModel("i18n").getProperty("Label.CostCenterName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeCostCenter: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var costCenter = oEvent.getSource().getValue();

			if (!costCenter) {
				// prItemDetail.setProperty("/KOKRS", "");
				// prItemDetail.setProperty("/KOKRS_NAME", "");
				index.KOSTL = "";
				index.KOSTL_NAME = "";
				model.updateBindings();
				return;
			}
			
			if(!index.KOKRS){
				index.KOKRS = "1000";
			}
			
			var path = "/F4CostCenterSet(KOKRS='" + index.KOKRS + "',KOSTL='" + costCenter + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/KOKRS_NAME", s.BEZEI);
					index.KOSTL_NAME = s.KTEXT;
					model.updateBindings();
					that.changeMessageModel(sTarget);
					
				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/KOKRS", "");
					// prItemDetail.setProperty("/KOKRS_NAME", "");
					index.KOSTL = "";
					index.KOSTL_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHOrder: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Order"),
				key: "AUFNR",
				descriptionKey: "KTEXT",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "AUFNR",
					label: this.getView().getModel("i18n").getProperty("Label.Order")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.AUFNR = pSelected.AUFNR;
                    	index.AUFNR_NAME = pSelected.KTEXT;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.Order"),
                        template: "AUFNR",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.OrderName"),
                        template: "KTEXT",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4OrderSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "AUFNR",
                        label: this.getView().getModel("i18n").getProperty("Label.Order"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "KTEXT",
                        label: this.getView().getModel("i18n").getProperty("Label.OrderName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeOrder: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var order = oEvent.getSource().getValue();

			if (!order) {
				// prItemDetail.setProperty("/KOKRS", "");
				// prItemDetail.setProperty("/KOKRS_NAME", "");
				index.AUFNR = "";
				index.AUFNR_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4OrderSet('" + order + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/KOKRS_NAME", s.BEZEI);
					index.AUFNR_NAME = s.KTEXT;
					model.updateBindings();
					
				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/KOKRS", "");
					// prItemDetail.setProperty("/KOKRS_NAME", "");
					index.AUFNR = "";
					index.AUFNR_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHFund: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Fund"),
				key: "FINCODE",
				descriptionKey: "BEZEICH",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "FINCODE",
					label: this.getView().getModel("i18n").getProperty("Label.Fund")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.GEBER = pSelected.FINCODE;
                    	index.GEBER_NAME = pSelected.BEZEICH;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.Fund"),
                        template: "FINCODE",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.FundName"),
                        template: "BEZEICH",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4FundSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "FINCODE",
                        label: this.getView().getModel("i18n").getProperty("Label.Fund"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BEZEICH",
                        label: this.getView().getModel("i18n").getProperty("Label.FundName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeFund: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var fund = oEvent.getSource().getValue();
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var fund = prItemDetail.getProperty("/GEBER");

			if (!fund) {
				// prItemDetail.setProperty("/GEBER", "");
				// prItemDetail.setProperty("/GEBER_NAME", "");
				index.GEBER = "";
				index.GEBER_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4FundSet('" + fund + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/GEBER_NAME", s.BEZEICH);
					index.GEBER_NAME = s.BEZEICH;
					model.updateBindings();
					that.changeMessageModel(sTarget);
					
				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/GEBER", "");
					// prItemDetail.setProperty("/GEBER_NAME", "");
					index.GEBER = "";
					index.GEBER_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHGl: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.GlAccount"),
				key: "SAKNR",
				descriptionKey: "TXT20",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "SAKNR",
					label: this.getView().getModel("i18n").getProperty("Label.GlAccount")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.SAKTO = pSelected.SAKNR;
                    	index.SAKTO_NAME = pSelected.TXT20;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.GlAccount"),
                        template: "SAKNR",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.GlAccountName"),
                        template: "TXT20",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4GlSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "SAKNR",
                        label: this.getView().getModel("i18n").getProperty("Label.GlAccount"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "TXT20",
                        label: this.getView().getModel("i18n").getProperty("Label.GlAccountName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeGl: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var Gl = prItemDetail.getProperty("/SAKTO");
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var Gl = oEvent.getSource().getValue();

			if (!Gl) {
				// prItemDetail.setProperty("/SAKTO", "");
				// prItemDetail.setProperty("/SAKTO_NAME", "");
				
				index.SAKTO = "";
				index.SAKTO_NAME = "";
				model.updateBindings();
				
				return;
			}

			var path = "/F4GlSet('" + Gl + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/SAKTO_NAME", s.TXT20);
					index.SAKTO_NAME = s.TXT20;
					model.updateBindings();
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/SAKTO", "");
					// prItemDetail.setProperty("/SAKTO_NAME", "");
					index.SAKTO = "";
					index.SAKTO_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHBusinessArea: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.BusinessArea"),
				key: "GSBER",
				descriptionKey: "GTEXT",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "GSBER",
					label: this.getView().getModel("i18n").getProperty("Label.BusinessArea")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.GSBER = pSelected.GSBER;
                    	index.GSBER_NAME = pSelected.GTEXT;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.BusinessArea"),
                        template: "GSBER",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.BusinessAreaName"),
                        template: "GTEXT",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4BusAreaSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "GSBER",
                        label: this.getView().getModel("i18n").getProperty("Label.BusinessArea"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "GTEXT",
                        label: this.getView().getModel("i18n").getProperty("Label.BusinessAreaName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeBusinessArea: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var busArea = prItemDetail.getProperty("/GSBER");
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			var sTarget = oEvent.getSource().getBindingPath("value");
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var busArea = oEvent.getSource().getValue();

			if (!busArea) {
				// prItemDetail.setProperty("/GSBER", "");
				// prItemDetail.setProperty("/GSBER_NAME", "");
				index.GSBER = "";
				index.GSBER_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4BusAreaSet('" + busArea + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/GSBER_NAME", s.GTEXT);
					index.GSBER_NAME = s.GTEXT;
					model.updateBindings();
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/GSBER", "");
					// prItemDetail.setProperty("/GSBER_NAME", "");
					index.GSBER = "";
					index.GSBER_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHFunctionalArea: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.FunctionalArea"),
				key: "FKBER",
				descriptionKey: "FKBTX",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "FKBER",
					label: this.getView().getModel("i18n").getProperty("Label.FunctionalArea")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.FKBER = pSelected.FKBER;
                    	index.FKBER_NAME = pSelected.FKBTX;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.FunctionalArea"),
                        template: "FKBER",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.FunctionalAreaName"),
                        template: "FKBTX",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4FuncAreaSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "FKBER",
                        label: this.getView().getModel("i18n").getProperty("Label.FunctionalArea"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "FKBTX",
                        label: this.getView().getModel("i18n").getProperty("Label.FunctionalAreaName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeFunctionalArea: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var funcArea = prItemDetail.getProperty("/FKBER");
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var funcArea = oEvent.getSource().getValue();
			
			if (!funcArea) {
				// prItemDetail.setProperty("/FKBER", "");
				// prItemDetail.setProperty("/FKBER_NAME", "");
				
				index.FKBER = "";
				index.FKBER_NAME = "";
				model.updateBindings();
				
				return;
			}

			var path = "/F4FuncAreaSet('" + funcArea + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/FKBER_NAME", s.FKBTX);
					index.FKBER_NAME = s.FKBTX;
					model.updateBindings();
					that.changeMessageModel(sTarget);
					
				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/FKBER", "");
					// prItemDetail.setProperty("/FKBER_NAME", "");
					index.FKBER = "";
					index.FKBER_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHFundCenter: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.FundCenter"),
				key: "FICTR",
				descriptionKey: "BEZEICH",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "FICTR",
					label: this.getView().getModel("i18n").getProperty("Label.FundCenter")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.FISTL = pSelected.FICTR;
                    	index.FISTL_NAME = pSelected.BEZEICH;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.FundCenter"),
                        template: "FICTR",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.FundCenterName"),
                        template: "BEZEICH",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4FundCenterSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "FICTR",
                        label: this.getView().getModel("i18n").getProperty("Label.FundCenter"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BEZEICH",
                        label: this.getView().getModel("i18n").getProperty("Label.FundCenterName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeFundCenter: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var fundCenter = prItemDetail.getProperty("/FISTL");
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var fundCenter = oEvent.getSource().getValue();

			if (!fundCenter) {
				// prItemDetail.setProperty("/FISTL", "");
				// prItemDetail.setProperty("/FISTL_NAME", "");
				index.FISTL = "";
				index.FISTL_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4FundCenterSet('" + fundCenter + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/FISTL_NAME", s.BEZEICH);
					index.FISTL_NAME = s.BEZEICH;
					model.updateBindings();
					that.changeMessageModel(sTarget);
					
				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/FISTL", "");
					// prItemDetail.setProperty("/FISTL_NAME", "");
					index.FISTL = "";
					index.FISTL_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHFundCenterU: function (oEvent) {

			var that = this;
			var model = this.C_MODEL.prItemDetail;
			var index = model.getProperty("/");
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.FundCenter"),
				key: "FICTR",
				descriptionKey: "BEZEICH",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "FICTR",
					label: this.getView().getModel("i18n").getProperty("Label.FundCenter")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.ZZMM_FISTL = pSelected.FICTR;
                    	index.FISTL_NAME = pSelected.BEZEICH;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.FundCenter"),
                        template: "FICTR",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.FundCenterName"),
                        template: "BEZEICH",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4FundCenterSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "FICTR",
                        label: this.getView().getModel("i18n").getProperty("Label.FundCenter"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BEZEICH",
                        label: this.getView().getModel("i18n").getProperty("Label.FundCenterName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeFundCenterU: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var model = this.C_MODEL.prItemDetail;
			var index = model.getProperty("/");
			
			var fundCenter = oEvent.getSource().getValue();

			if (!fundCenter) {
				index.ZZMM_FISTL = "";
				index.FISTL_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4FundCenterSet('" + fundCenter + "')";

			srvModel.read(path, {
				success: function (s) {
					index.FISTL_NAME = s.BEZEICH;
					model.updateBindings();
				},
				error: function (pError) {
					index.ZZMM_FISTL = "";
					index.FISTL_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHFundU: function (oEvent) {

			var that = this;
			var model = this.C_MODEL.prItemDetail;
			var index = model.getProperty("/");
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Fund"),
				key: "FINCODE",
				descriptionKey: "BEZEICH",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "FINCODE",
					label: this.getView().getModel("i18n").getProperty("Label.Fund")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.ZZMM_GEBER = pSelected.FINCODE;
                    	index.GEBER_NAME = pSelected.BEZEICH;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.Fund"),
                        template: "FINCODE",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.FundName"),
                        template: "BEZEICH",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4FundSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "FINCODE",
                        label: this.getView().getModel("i18n").getProperty("Label.Fund"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BEZEICH",
                        label: this.getView().getModel("i18n").getProperty("Label.FundName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeFundU: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var model = this.C_MODEL.prItemDetail;
			var index = model.getProperty("/");
			
			var fund = oEvent.getSource().getValue();

			if (!fund) {
				index.ZZMM_GEBER = "";
				index.GEBER_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4FundSet('" + fund + "')";

			srvModel.read(path, {
				success: function (s) {
					index.GEBER_NAME = s.BEZEICH;
					model.updateBindings();
				},
				error: function (pError) {
					index.ZZMM_GEBER = "";
					index.GEBER_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHAssetClass: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.AssetClass"),
				key: "ANLKL",
				descriptionKey: "TXK20",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "ANLKL",
					label: this.getView().getModel("i18n").getProperty("Label.AssetClass")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.ANLKL = pSelected.ANLKL;
                    	index.ANLKL_NAME = pSelected.TXK20;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.AssetClass"),
                        template: "ANLKL",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.AssetClassName"),
                        template: "TXK20",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4AssetClassSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "ANLKL",
                        label: this.getView().getModel("i18n").getProperty("Label.AssetClass"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "TXK20",
                        label: this.getView().getModel("i18n").getProperty("Label.AssetClassName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeAssetClass: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var fundCenter = prItemDetail.getProperty("/FISTL");
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var assetClass = oEvent.getSource().getValue();

			if (!assetClass) {
				index.ANLKL = "";
				index.ANLKL_NAME = "";
				index.ZANLKL2 = "";
				index.ZANLKL2_NAME = "";
				index.ZANLKL = "";
            	index.NDJAR = "";
            	index.NDPER = "";
            	index.SCHRW_PROZ = "";
            	index.AFASL = "";
				model.updateBindings();
				return;
			}

			var path = "/F4AssetClassSet('" + assetClass + "')";

			srvModel.read(path, {
				success: function (s) {
					index.ANLKL_NAME = s.TXK20;
					index.ZANLKL2 = "";
					index.ZANLKL2_NAME = "";
					index.ZANLKL = "";
	            	index.NDJAR = "";
	            	index.NDPER = "";
	            	index.SCHRW_PROZ = "";
	            	index.AFASL = "";
					model.updateBindings();
				},

				error: function (pError) {
					index.ANLKL = "";
					index.ANLKL_NAME = "";
					index.ZANLKL2 = "";
					index.ZANLKL2_NAME = "";
					index.ZANLKL = "";
	            	index.NDJAR = "";
	            	index.NDPER = "";
	            	index.SCHRW_PROZ = "";
	            	index.AFASL = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHSubAssetClass: function (oEvent) {

			var that = this;
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("ANLKL","EQ",index.ANLKL,""));
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.SubAssetClass"),
				key: "ZANLKL2",
				descriptionKey: "ZANLKL2_TXT",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "ZANLKL2",
					label: this.getView().getModel("i18n").getProperty("Label.SubAssetClass")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.ZANLKL2 = pSelected.ZANLKL2;
                    	index.ZANLKL2_NAME = pSelected.ZANLKL2_TXT;
                    	index.ZANLKL = pSelected.ZANLKL;
                    	index.NDJAR = pSelected.NDJAR;
                    	index.NDPER = pSelected.NDPER;
                    	index.SCHRW_PROZ = pSelected.SCHRW_PROZ;
                    	index.AFASL = pSelected.AFASL;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.SubAssetClass"),
                        template: "ZANLKL2",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.SubAssetClassName"),
                        template: "ZANLKL2_TXT",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4Asset2Set",
					filters: aFilters
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "ZANLKL2",
                        label: this.getView().getModel("i18n").getProperty("Label.SubAssetClass"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "ZANLKL2_TXT",
                        label: this.getView().getModel("i18n").getProperty("Label.SubAssetClassName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeSubAssetClass: function (oEvent) {

			var that = this;
			var srvModel = that.getView().getModel();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var subAsset = oEvent.getSource().getValue();

			if (!subAsset) {
				index.ZANLKL2 = "";
				index.ZANLKL2_NAME = "";
				index.ZANLKL = "";
            	index.NDJAR = "";
            	index.NDPER = "";
            	index.SCHRW_PROZ = "";
            	index.AFASL = "";
				model.updateBindings();
				return;
			}

			var path = "/F4Asset2Set(ANLKL='" + index.ANLKL + "',ZANLKL2='" + subAsset + "')";

			srvModel.read(path, {
				success: function (s) {
					index.ZANLKL2_NAME = s.ZANLKL2_TXT;
					index.ZANLKL = s.ZANLKL;
                	index.NDJAR = s.NDJAR;
                	index.NDPER = s.NDPER;
                	index.SCHRW_PROZ = s.SCHRW_PROZ;
                	index.AFASL = s.AFASL;
					model.updateBindings();
				},

				error: function (pError) {
					index.ZANLKL2 = "";
					index.ZANLKL2_NAME = "";
					index.ZANLKL = "";
	            	index.NDJAR = "";
	            	index.NDPER = "";
	            	index.SCHRW_PROZ = "";
	            	index.AFASL = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHFiscalYearAsset: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.FiscalYearAsset"),
				key: "ORD4X",
				descriptionKey: "ORDTX",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "ORD4X",
					label: this.getView().getModel("i18n").getProperty("Label.FiscalYearAsset")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.ORD41 = pSelected.ORD4X;
                    	index.ORD41_NAME = pSelected.ORDTX;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.FiscalYearAsset"),
                        template: "ORD4X",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.FiscalYearAssetName"),
                        template: "ORDTX",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4EvaYearSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "ORD4X",
                        label: this.getView().getModel("i18n").getProperty("Label.FiscalYearAsset"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "ORDTX",
                        label: this.getView().getModel("i18n").getProperty("Label.FiscalYearAssetName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeFiscalYearAsset: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var fundCenter = prItemDetail.getProperty("/FISTL");
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var fiscalYearAsset = oEvent.getSource().getValue();

			if (!fiscalYearAsset) {
				// prItemDetail.setProperty("/FISTL", "");
				// prItemDetail.setProperty("/FISTL_NAME", "");
				index.ANLKL = "";
				index.ANLKL_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4EvaYearSet('" + fiscalYearAsset + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/FISTL_NAME", s.BEZEICH);
					index.ORD41_NAME = s.ORDTX;
					model.updateBindings();
					
				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/FISTL", "");
					// prItemDetail.setProperty("/FISTL_NAME", "");
					index.ORD41 = "";
					index.ORD41_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHActivityType: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.ActivityType"),
				key: "GDLGRP",
				descriptionKey: "ORDTX",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "GDLGRP",
					label: this.getView().getModel("i18n").getProperty("Label.ActivityType")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.GDLGRP = pSelected.GDLGRP;
                    	index.GDLGRP_NAME = pSelected.GDLGRP_TXT;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.ActivityType"),
                        template: "GDLGRP",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.ActivityTypeName"),
                        template: "GDLGRP_TXT",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4ActivityTypeSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "GDLGRP",
                        label: this.getView().getModel("i18n").getProperty("Label.ActivityType"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "GDLGRP_TXT",
                        label: this.getView().getModel("i18n").getProperty("Label.ActivityTypeName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeActivityType: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var fundCenter = prItemDetail.getProperty("/FISTL");
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var activityType = oEvent.getSource().getValue();

			if (!activityType) {
				// prItemDetail.setProperty("/FISTL", "");
				// prItemDetail.setProperty("/FISTL_NAME", "");
				index.GDLGRP = "";
				index.GDLGRP_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4ActivityTypeSet('" + activityType + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/FISTL_NAME", s.BEZEICH);
					index.GDLGRP_NAME = s.GDLGRP_TXT;
					model.updateBindings();
					
				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/FISTL", "");
					// prItemDetail.setProperty("/FISTL_NAME", "");
					index.GDLGRP = "";
					index.GDLGRP_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHCommitment: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.CommitmentItem"),
				key: "FIPEX",
				descriptionKey: "BEZEI",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "FIPEX",
					label: this.getView().getModel("i18n").getProperty("Label.CommitmentItem")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.FIPOS = pSelected.FIPEX;
                    	index.FIPOS_NAME = pSelected.BEZEI;
                    	model.updateBindings();
                    	that.changeMessageModel(sTarget);
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.CommitmentItem"),
                        template: "FIPEX",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.CommitmentItemName"),
                        template: "BEZEI",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4CommitItemSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "FIPEX",
                        label: this.getView().getModel("i18n").getProperty("Label.CommitmentItem"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BEZEI",
                        label: this.getView().getModel("i18n").getProperty("Label.CommitmentItemName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeCommitment: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			// var prItemDetail = that.C_MODEL.prItemDetail;
			// var commitmentItem = prItemDetail.getProperty("/FIPOS");
			var sTarget = oEvent.getSource().getBindingPath("value");
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			// var prItemDetail = that.C_MODEL.prItemDetail;
			var commitmentItem = oEvent.getSource().getValue();

			if (!commitmentItem) {
				// prItemDetail.setProperty("/FIPOS", "");
				// prItemDetail.setProperty("/FIPOS_NAME", "");
				index.FIPOS = "";
				index.FIPOS_NAME = "";
				model.updateBindings();
				return;
			}

			var path = "/F4CommitItemSet('" + commitmentItem + "')";

			srvModel.read(path, {

				success: function (s) {
					
					// prItemDetail.setProperty("/FIPOS_NAME", s.BEZEI);
					index.FIPOS_NAME = s.BEZEI;
					model.updateBindings();
					that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					// prItemDetail.setProperty("/FIPOS", "");
					// prItemDetail.setProperty("/FIPOS_NAME", "");
					index.FIPOS = "";
					index.FIPOS_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHEarmarkedFunds: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.EarmarkedFunds"),
				key: "BELNR",
				descriptionKey: "",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "BELNR",
					label: this.getView().getModel("i18n").getProperty("Label.EarmarkedFunds")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.KBLNR = pSelected.BELNR;
                    	index.KBLPOS = pSelected.BLPOS;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.EarmarkedFunds"),
                        template: "BELNR",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.EarmarkedFundsItem"),
                        template: "BLPOS",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4EarFundSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BELNR",
                        label: this.getView().getModel("i18n").getProperty("Label.EarmarkedFunds"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "BLPOS",
                        label: this.getView().getModel("i18n").getProperty("Label.EarmarkedFundsItem"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeEarmarkedFunds: function (oEvent) {

			var that = this;
			var srvModel = that.getView().getModel();
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var earmarkedFund = index.KBLNR;
			var earmarkedFundItem = index.KBLPOS;
			
			if(!earmarkedFund || !earmarkedFundItem){
				return;
			}

			if (!earmarkedFund && !earmarkedFundItem) {
				index.KBLNR = "";
				index.KBLPOS = "";
				model.updateBindings();
				return;
			}

			var path = "/F4EarFundSet(BELNR='" + earmarkedFund + "',BLPOS='" + earmarkedFundItem + "')";
			srvModel.read(path, {
				success: function (s) {
					index.KBLNR = s.BELNR;
					index.KBLPOS = s.BLPOS;
					model.updateBindings();
				},
				error: function (e) {
					index.KBLNR = "";
					index.KBLPOS = "";
					model.updateBindings();
					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});
				}
			});

		},
		
		onVHAsset: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			// var model = this.C_MODEL.prItemDetail;
			// var index = model.getData();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			var paths;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					paths = oEvent.getSource().getBindingContext("prAccountAssignment").getPath();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Asset"),
				key: "ANLN1",
				descriptionKey: "TXT50",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "ANLN1",
					label: this.getView().getModel("i18n").getProperty("Label.Asset")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.ANLN1 = pSelected.ANLN1;
                    	index.ANLN2 = pSelected.ANLN2;
                    	model.updateBindings();
                    	if(knttp === "A"){
                    		that.getAssetInfo(index.ANLN1,index.ANLN2,paths);
                    	}
					},
					cancel: null,
					afterClose: null
				},
				columns: [
                    {
                        label: this.getView().getModel("i18n").getProperty("Label.Asset"),
                        template: "ANLN1",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.SubAsset"),
                        template: "ANLN2",
                        demandPopin: false
                    }, {
                        label: this.getView().getModel("i18n").getProperty("Label.AssetName"),
                        template: "TXT50",
                        demandPopin: false
                    }
                ],
				datas: {
					odataModel: mService,
					entitySet: "/F4AssetSet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "ANLN1",
                        label: this.getView().getModel("i18n").getProperty("Label.Asset"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "ANLN2",
                        label: this.getView().getModel("i18n").getProperty("Label.SubAsset"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    },
                    {
                        groupTitle: "",
                        groupName: "group1",
                        name: "TXT50",
                        label: this.getView().getModel("i18n").getProperty("Label.AssetName"),
                        control: new sap.m.Input(),
                        operation: sap.ui.model.FilterOperator.NE
                    }
                ]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		onChangeAsset: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			
			var knttp = oEvent.getSource().getCustomData()[0].getProperty("value");
			var model;
			var index;
			var paths;
			
			switch (knttp) {
				case "-":
					model = this.C_MODEL.prItemDetail;
					index = model.getProperty("/");
					break;
				case "K":
					model = this.C_MODEL.prAccountAssignment;
					index = model.getProperty("/0");
					break;
				case "A":
					model = this.C_MODEL.prAccountAssignment;
					index = oEvent.getSource().getBindingContext("prAccountAssignment").getObject();
					paths = oEvent.getSource().getBindingContext("prAccountAssignment").getPath();
					break;
				case "NA":
					model = this.C_MODEL.prNewAsset;
					index = model.getProperty("/");
					break;
				default:
			}
			
			/* CH14 : DEL
			var asset = oEvent.getSource().getValue();

			if (!asset) {
				index.ANLN1 = "";
				index.ANLN2 = "";
				index.MENGE = "1";
				index.SAKTO = "";
				index.SAKTO_NAME = "";
				index.GSBER = "";
				index.GSBER_NAME = "";
				index.FIPOS = "";
				index.FIPOS_NAME = "";
				index.AUFNR = "";
				index.AUFNR_NAME = "";
				index.FISTL = "";
				index.FISTL_NAME = "";
				index.GEBER = "";
				index.GEBER_NAME = "";
				index.FKBER = "";
				index.FKBER_NAME = "";
				model.updateBindings();
				return;
			}
			CH14 : DEL */

			// CH14 : INS
			var oSource = oEvent.getSource().mBindingInfos.value.binding.sPath;

			if (oSource === "ANLN1") {
				var asset = oEvent.getSource().getValue();
				
				if (!asset) {
					index.ANLN1 = "";
					index.ANLN2 = "";
					index.MENGE = "1";
					index.SAKTO = "";
					index.SAKTO_NAME = "";
					index.GSBER = "";
					index.GSBER_NAME = "";
					index.FIPOS = "";
					index.FIPOS_NAME = "";
					index.AUFNR = "";
					index.AUFNR_NAME = "";
					index.FISTL = "";
					index.FISTL_NAME = "";
					index.GEBER = "";
					index.GEBER_NAME = "";
					index.FKBER = "";
					index.FKBER_NAME = "";
					model.updateBindings();
					return;
				} else {
					var tbrIndex = parseInt(paths.replace('/',''),10);
					var subasset = that.getView().getModel("prAccountAssignment").oData[tbrIndex].ANLN2;

					if (!subasset) {
						var subasset = "0";
					}
				}
			} else if(oSource === "ANLN2") {
				var tbrIndex = parseInt(paths.replace('/',''),10);
				var asset = that.getView().getModel("prAccountAssignment").oData[tbrIndex].ANLN1;

				if (!asset) {
					index.ANLN1 = "";
					index.ANLN2 = "";
					index.MENGE = "1";
					index.SAKTO = "";
					index.SAKTO_NAME = "";
					index.GSBER = "";
					index.GSBER_NAME = "";
					index.FIPOS = "";
					index.FIPOS_NAME = "";
					index.AUFNR = "";
					index.AUFNR_NAME = "";
					index.FISTL = "";
					index.FISTL_NAME = "";
					index.GEBER = "";
					index.GEBER_NAME = "";
					index.FKBER = "";
					index.FKBER_NAME = "";
					model.updateBindings();
					return;
				} else {
					var subasset = oEvent.getSource().getValue();;
				}
			}
			// CH14 : INS

			// var path = "/F4AssetSet('" + asset + "')";			// CH14 : DEL
			var path = "/F4AssetSet(ANLN1='" + asset + "',ANLN2='" + subasset + "')";	// CH14 : INS

			srvModel.read(path, {

				success: function (s) {
					index.ANLN2 = s.ANLN2;
					model.updateBindings();
					if(knttp === "A"){
						that.getAssetInfo(index.ANLN1,index.ANLN2,paths);
					}
				},

				error: function (pError) {
					index.ANLN1 = "";
					index.ANLN2 = "";
					index.MENGE = "1";
					index.SAKTO = "";
					index.SAKTO_NAME = "";
					index.GSBER = "";
					index.GSBER_NAME = "";
					index.FIPOS = "";
					index.FIPOS_NAME = "";
					index.AUFNR = "";
					index.AUFNR_NAME = "";
					index.FISTL = "";
					index.FISTL_NAME = "";
					index.GEBER = "";
					index.GEBER_NAME = "";
					index.FKBER = "";
					index.FKBER_NAME = "";
					model.updateBindings();

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		getAssetInfo: function(asset,subAsset,paths){
			
			var that = this;
			var srvModel = that.getView().getModel();
			var model = this.C_MODEL.prAccountAssignment;
			var path = "/AssetInfoSet(KOKRS='1000',ANLN1='" + asset + "',ANLN2='" + subAsset + "')";
			srvModel.read(path, {
				success: function (s) {
					model.setProperty(paths + "/ANLN2", s.ANLN2);
					model.setProperty(paths + "/SAKTO", s.SAKTO);
					model.setProperty(paths + "/SAKTO_NAME", s.SAKTO_NAME);
					model.setProperty(paths + "/GSBER", s.GSBER);
					model.setProperty(paths + "/GSBER_NAME", s.GSBER_NAME);
					model.setProperty(paths + "/FIPOS", s.FIPOS);
					model.setProperty(paths + "/FIPOS_NAME", s.FIPOS_NAME);
					model.setProperty(paths + "/AUFNR", s.AUFNR);
					model.setProperty(paths + "/AUFNR_NAME", s.AUFNR_NAME);
					model.setProperty(paths + "/FISTL", s.FISTL);
					model.setProperty(paths + "/FISTL_NAME", s.FISTL_NAME);
					model.setProperty(paths + "/GEBER", s.GEBER);
					model.setProperty(paths + "/GEBER_NAME", s.GEBER_NAME);
					model.setProperty(paths + "/FKBER", s.FKBER);
					model.setProperty(paths + "/FKBER_NAME", s.FKBER_NAME);
					model.updateBindings();
				},
				error: function (pError) {
					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});
				}
			});
			
		},
		
		onChangeSumLimit: function(oEvent){
			
			var inputValue = oEvent.getParameters().newValue;
			oEvent.getSource().setValue(GUtilities.formatAmount(inputValue));
			
			var index = this.C_MODEL.prItemDetail.getProperty("/");
			
			if(parseFloat(index.SUMLIMIT) > 0){
				var sTarget = oEvent.getSource().getBindingPath("value");
				this.changeMessageModel(sTarget);
			}
			
		},
		
		onChangeExpectLimit: function(oEvent){
			
			var inputValue = oEvent.getParameters().newValue;
			oEvent.getSource().setValue(GUtilities.formatAmount(inputValue));
			
			var index = this.C_MODEL.prItemDetail.getProperty("/");
			
			if(parseFloat(index.COMMITMENT) > 0){
				var sTarget = oEvent.getSource().getBindingPath("value");
				this.changeMessageModel(sTarget);
			}
			
			index.PREIS = index.COMMITMENT;
			index.RLWRT = index.COMMITMENT;
			
		},
		
		onChangeNolimit: function(oEvent){
			
			var sumLimitControl = this.getView().byId("idSumLimit");
			var sumLimitLabel = sumLimitControl.getParent().getLabel();
			
			sumLimitLabel.setRequired(!oEvent.mParameters.selected);
			sumLimitControl.setEditable(!oEvent.mParameters.selected);
			sumLimitControl.setValue(0);
			
		},
		
		onChangeQty: function(oEvent){
			
			var inputValue = oEvent.getParameters().newValue;
			oEvent.getSource().setValue(GUtilities.formatAmount(inputValue));
			
			var index = this.C_MODEL.prItemDetail.getProperty("/");
			// Check Price Unit
			if(index.PEINH && index.PEINH > 0){
				if(index.PEINH === 1){
					index.RLWRT = index.MENGE * index.PREIS;
				}else{
					index.RLWRT = ( index.MENGE / index.PEINH ) * index.PREIS;
				}
			}
			
			if(parseFloat(index.MENGE) > 0){
				var sTarget = oEvent.getSource().getBindingPath("value");
				this.changeMessageModel(sTarget);
			}
			
		},
		
		onChangeUnitPrice: function(oEvent){
			
			var inputValue = oEvent.getParameters().newValue;
			oEvent.getSource().setValue(GUtilities.formatAmount(inputValue));
			
			var index = this.C_MODEL.prItemDetail.getProperty("/");
			// Check Price Unit
			if(index.PEINH && index.PEINH > 0){
				if(index.PEINH === 1){
					index.RLWRT = index.MENGE * index.PREIS;
				}else{
					index.RLWRT = ( index.MENGE / index.PEINH ) * index.PREIS;
				}
			}
			
			if(parseFloat(index.PREIS) > 0){
				var sTarget = oEvent.getSource().getBindingPath("value");
				this.changeMessageModel(sTarget);
			}
			
		},
		
		onChangePriceUnit: function(oEvent){
			
			var inputValue = oEvent.getParameters().newValue;
			oEvent.getSource().setValue(GUtilities.formatAmount(inputValue));
			
			var index = this.C_MODEL.prItemDetail.getProperty("/");
			// Check Price Unit
			if(index.PEINH && index.PEINH > 0){
					if(index.PEINH === 1){
						index.RLWRT = index.MENGE * index.PREIS;
					}else{
						index.RLWRT = ( index.MENGE / index.PEINH ) * index.PREIS;
					}
			}
			
			if(parseFloat(index.PEINH) > 0){
				var sTarget = oEvent.getSource().getBindingPath("value");
				this.changeMessageModel(sTarget);
			}
			
		},
		
		onChangeDeliveryDate: function(oEvent){
			if(oEvent.getParameters().valid){
				var sTarget = oEvent.getSource().getBindingPath("dateValue");
				this.changeMessageModel(sTarget);
			}else{
				oEvent.getSource().setDateValue(null);
				oEvent.getSource().setValue(null);
			}
		},
		
		onChangeTotalValue: function(oEvent){
			var index = this.C_MODEL.prItemDetail.getProperty("/");
			if(index.PREIS !== 0){
				index.MENGE = index.RLWRT / index.PREIS;
			}
		},
		
		onVHUnit: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var model = this.C_MODEL.prItemDetail;
			var index = model.getProperty("/");
			var mService = that.getOwnerComponent().getModel();
			var sTarget = oEvent.getSource().getBindingPath("value");
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
                    	that.changeMessageModel(sTarget);
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
			var model = this.C_MODEL.prItemDetail;
			var index = model.getProperty("/");
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
		
		onVHCurrency: function (oEvent) {

			var that = this;
			// var oInputControl = oEvent.getSource();
			// var aTokens = oInputControl.getTokens();
			var model = this.C_MODEL.prItemDetail;
			var index = model.getProperty("/");
			var mService = that.getOwnerComponent().getModel();
			var oVHRParams = {
				compactUi: true,
				basicSearchText: "",
				title: this.getView().getModel("i18n").getProperty("Label.Currency"),
				key: "WAERS",
				descriptionKey: "KTEXT",
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				rangesKeyFields: [{
					key: "WAERS",
					label: this.getView().getModel("i18n").getProperty("Label.Currency")
				}],
				fullOperationKey: true,
				callbackFunction: {
					ok: function (oControlEvent, pTokens, pDataSet, pSelected) {
                    	index.WAERS = pSelected.WAERS;
                    	index.WAERS_NAME = pSelected.KTEXT;
                    	model.updateBindings();
					},
					cancel: null,
					afterClose: null
				},
				columns: [{
					label: this.getView().getModel("i18n").getProperty("Label.Currency"),
					template: "WAERS",
					demandPopin: true
				}, {
					label: this.getView().getModel("i18n").getProperty("Label.CurrencyName"),
					template: "KTEXT",
					demandPopin: true
				}],
				datas: {
					odataModel: mService,
					entitySet: "/F4CurrencySet"
				},
				basicTokens: [],
				filterMode: false,
				filterGroupItems: [{
					groupTitle: "",
					groupName: "group1",
					name: "WAERS",
					label: this.getView().getModel("i18n").getProperty("Label.Currency"),
					control: new sap.m.Input(),
					operation: "NE"
				}, {
					groupTitle: "",
					groupName: "group1",
					name: "KTEXT",
					label: this.getView().getModel("i18n").getProperty("Label.CurrencyName"),
					control: new sap.m.Input(),
					operation: "NE"
				}]
			};
			
			var loVHDialog = new CommonVHDialog();
			loVHDialog.show(oVHRParams);
		
		},
		
		handleCreateNewAsset: function(oEvent){

			var list = oEvent.getSource().getParent().getParent();
			var selectedPaths = list.getSelectedContextPaths();
			if(selectedPaths.length === 0){
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error( this.getView().getModel("i18n").getProperty("Message.Selected1Line"),
					{ styleClass: bCompact ? "sapUiSizeCompact" : "" }
				);
				return;
			}
			
			this.clearErrorLogAsset();
			
			var plant = "";
			var plantName = "";
			var userParamModel = this.getOwnerComponent().getModel("userParam");
			if(userParamModel){
				var param = userParamModel.getData();
				plant = param.WERKS;
				plantName = param.NAME1;
			}
			
			this.C_MODEL.prNewAsset.setData({GSBER: plant, GSBER_NAME: plantName});
			this.C_MODEL.prNewAsset.updateBindings();
			
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("com.cu.s4hana.zlpuba001.view.fragment.CreateNewAsset", this);
			}
			this._oDialog.setModel(this.getView().getModel());
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this.getView().addDependent(this._oDialog);

			this._oDialog.open();
			
		},
		
		doCreateNewAsset: function(oEvent){
			
			var that = this;
			var control = oEvent.getSource().getParent();
		    var list = oEvent.getSource().getParent().getParent().getContent()[0].getContent()[0].getSections()[3].getSubSections()[2].getBlocks()[0];
			var selectedPaths = list.getSelectedContextPaths();
			var model = list.getBinding("items").getModel();
			
			that.clearErrorLogAsset();
			
			if (that.validateDataForCreateNewAsset()) {
				
				control.setBusy(true);
				
				var dataForSubmit = that.createDataForVerifyNewAsset();
			
				var serviceUrl = that.oView.getModel().sServiceUrl;
				var odataServiceModel = new sap.ui.model.odata.v2.ODataModel(serviceUrl);
				// var contract = dataForSubmit.Contract;
				odataServiceModel.refreshSecurityToken();
				var prItemDetail = this.C_MODEL.prItemDetail.getData();
	
				// that.clearErrorLog();
				odataServiceModel.update("/PrAccAssignmentSet(BANFN='" + prItemDetail.BANFN + "',BNFPO='" + prItemDetail.BNFPO + "',ZEBKN='00')", dataForSubmit, {
	
					success: function (s) {
						
						list.getBinding("items").getModel()
						
						for(var i=0;i<selectedPaths.length;i++){
							var selectedData = model.getProperty(selectedPaths[i]);
								selectedData.ANLN1 = "NEW";
								selectedData.ANLKL = dataForSubmit.ANLKL;
								selectedData.GSBER = dataForSubmit.GSBER;
								selectedData.KOSTL = dataForSubmit.KOSTL;
								selectedData.GEBER = dataForSubmit.GEBER;
								selectedData.FKBER = dataForSubmit.FKBER;
								selectedData.FISTL = dataForSubmit.FISTL;
								selectedData.ORD41 = dataForSubmit.ORD41;
								selectedData.GDLGRP = dataForSubmit.GDLGRP;
								selectedData.ANLN1_NAME = dataForSubmit.ANLN1_NAME;
								selectedData.MEINS = dataForSubmit.MEINS;
								selectedData.ZANLKL = dataForSubmit.ZANLKL;
								selectedData.ZANLKL2 = dataForSubmit.ZANLKL2;
								selectedData.NDJAR = dataForSubmit.NDJAR;
								selectedData.NDPER = dataForSubmit.NDPER;
								selectedData.SCHRW_PROZ = dataForSubmit.SCHRW_PROZ;
								selectedData.AFASL = dataForSubmit.AFASL;
								selectedData.AUFNR = dataForSubmit.AUFNR;
						}
						
						control.setBusy(false);
						model.updateBindings();
						control.close();
						list.removeSelections();
						
					},
	
					error: function (e) {
						
						control.setBusy(false);
						
						try {
							var loError = JSON.parse(e.responseText);
							if (loError.error.innererror.errordetails.length > 0) {
								var laMsg = jQuery.extend(true, {}, loError.error.innererror);
								that.convertErrorFormat(laMsg.errordetails);
								that.createErrorMessagePopoverAsset(laMsg.errordetails);
							} else {
								if (loError) {
									MessageBox.error(e.message, {
										details: loError.error.message.value
									});
								} else {
									MessageBox.error(that.getView().getModel("i18n").getProperty("Message.RequestFailed"));
								}
							}
						} catch (err) {
							if (loError) {
								MessageBox.error(e.message, {
									details: loError.error.message.value
								});
							} else {
								MessageBox.error(that.getView().getModel("i18n").getProperty("Message.RequestFailed"));
							}
						}
						
					}
	
				});
			
			}
			
		},
		
		convertErrorFormat: function(arrErrors) {
			for (var i in arrErrors) {
				arrErrors[i].MESSAGE = arrErrors[i].message;
			}
		},
		
		createErrorMessagePopoverAsset: function (arrErrors) {

			var that = this;
			var errorList = [];
			var lvArrError = that.deleteDuplicateRecords(arrErrors);
			for (var i = 0; i < lvArrError.length; i++) {
				
				if(lvArrError[i]["code"] === "/IWBEP/CX_MGW_TECH_EXCEPTION"){
					continue;
				}
				
				var title = "";
				var msg = "";
				if (that.isHasData(lvArrError[i]["MESSAGE"])) {
					var msgArr = lvArrError[i]["MESSAGE"].split("|");
					if (msgArr.length > 1) {
						title = msgArr[1];
						msg = "Message: " + msgArr[1];
					} else {
						title = lvArrError[i]["MESSAGE"];
						msg = "Message: " + lvArrError[i]["MESSAGE"];
					};
				}
				if (title !== "Return") {
					var errorRow = {
						type: 'Error',
						title: title,
						description: msg,
						subtitle: '',
						counter: 1
					};
					errorList.push(errorRow);
				};

			};

			var oErrorModel = that.C_MODEL.errorsAsset;
			oErrorModel.setProperty("/ERROR_NUM", errorList.length);
			oErrorModel.setProperty("/VISIBLE", true);

			var oMessageTemplate = new sap.m.MessagePopoverItem({
				type: '{type}',
				title: '{title}',
				description: '{description}'
			});

			that.oMessagePopoverAsset = new sap.m.MessagePopover({
				items: {
					path: '/',
					template: oMessageTemplate
				}
			});

			var oMsgErrorModel = new sap.ui.model.json.JSONModel(errorList);
			that.oMessagePopoverAsset.setModel(oMsgErrorModel);

			if (errorList.length > 0) {
				sap.m.MessageBox.error(that.getView().getModel("i18n").getProperty("Message.SeeErrorLog"));
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
		
		handleErrorLogAssetPress: function (evt) {
			this.oMessagePopoverAsset.openBy(evt.getSource());
		},
		
		clearErrorLogAsset: function () {
			if (this.oMessagePopoverAsset) {
				this.oMessagePopoverAsset.close();
			}
			this.C_MODEL.errorsAsset.setProperty("/VISIBLE", false);
			this.C_MODEL.errorsAsset.setProperty("/ERROR_NUM", 0);
		},
		
		validateDataForCreateNewAsset: function(){
			return true;	
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
		
		createDataForVerifyNewAsset: function(){
			var data = this.C_MODEL.prNewAsset.getData();
			var prItemDetail = this.C_MODEL.prItemDetail.getData();
			var record = {
				ANLKL: data.ANLKL,
				GSBER: data.GSBER,
				KOSTL: data.KOSTL,
				GEBER: data.GEBER,
				FKBER: data.FKBER,
				FISTL: data.FISTL,
				ORD41: data.ORD41,
				GDLGRP: data.GDLGRP,
				ANLN1_NAME: prItemDetail.TXZ01,
				MEINS: prItemDetail.MEINS,
				ZANLKL: data.ZANLKL,
				ZANLKL2: data.ZANLKL2,
				NDJAR: data.NDJAR,
				NDPER: data.NDPER,
				SCHRW_PROZ: data.SCHRW_PROZ,
				AFASL: data.AFASL,
				AUFNR: data.AUFNR
			};
			
			return record;
			
		},
		
		handleAddAsset: function(oEvent){
			var that = this;
			var list = oEvent.getSource().getParent().getParent();
			
			var itemQty = this.C_MODEL.prItemDetail.getData().MENGE;
			var assetList = this.C_MODEL.prAccountAssignment.getData();
			var remainQty = itemQty;
			for(var i=0;i<assetList.length;i++){
				remainQty = parseInt(remainQty,0) - parseInt(assetList[i].MENGE,0);
			}
			
			var addAssetDialog = new sap.m.Dialog({
				title: that.getView().getModel("i18n").getProperty("Label.Confirm"),
				type: 'Message',
				content: [
					new sap.m.HBox({
						justifyContent: "Center",
						alignItems: "Center",
						items: [
							new sap.m.Label({ text: that.getView().getModel("i18n").getProperty("Label.ConfirmAddQty"), labelFor: 'idAddAsset'}),
							new sap.m.StepInput('idAddAsset', {
								value: remainQty,
								min: 1,
								width: '80px'
							}).addStyleClass("sapUiTinyMarginBegin")
						]
					})
				],
				beginButton: new sap.m.Button({
					text: that.getView().getModel("i18n").getProperty("Label.Ok"),
					enabled: true,
					press: function () {
						var val = sap.ui.getCore().byId('idAddAsset').getValue();
						addAssetDialog.close();
						
						if(val > 0){
							that.doHandleAddAsset(val);
						}
						list.removeSelections();
					}
				}),
				endButton: new sap.m.Button({
					text: that.getView().getModel("i18n").getProperty("Button.Cancel"),
					press: function () {
						addAssetDialog.close();
					}
				}),
				afterClose: function() {
					addAssetDialog.destroy();
				}
			});

			addAssetDialog.open();
			
		},
		
		doHandleAddAsset: function(val){
			
			var prItemData = this.C_MODEL.prItemDetail.getData();
			var model = this.C_MODEL.prAccountAssignment;
			var data = model.getData();
			
			//Get max line
			// var currentItem = data.length; //DEL CH07
			
			//<BOI CH07
			var lastItem = data.length - 1;
			if(lastItem < 0) {
				var currentItem = data.length;}
			
			else{
				var currentItem = data[lastItem].ZEBKN; }
			//>EOI CH07
			
			for(var i=1;i<=val;i++){
				currentItem = parseInt(currentItem,0);
				if(currentItem < 9){
					var nextItem = "0" + (currentItem + 1);
				}else{
					var nextItem = "" + (currentItem + 1);
				}
				currentItem = nextItem;
				data.push({
					BANFN: prItemData.BANFN,
					BNFPO: prItemData.BNFPO,
					ZEBKN: nextItem,
					MENGE: 1,
					MEINS: prItemData.MEINS
				});
			}
			
			model.setData([]);
			model.setData(data);
			model.updateBindings();
			
			//<BOI CH07
			//Sync back
			var prItemModel = that.getOwnerComponent().getModel("prItem");
			var prItemData = prItemModel.getProperty("/");
			for(var i=0;i<prItemData.length;i++){
				if(parseInt(prItemData[i].BNFPO,0) === parseInt(prItem,0)){
					prItemData[i].PrAccAssignment.results = [];
					prItemData[i].PrAccAssignment.results = prAccAssignmentData;
				}
			}
			prItemModel.updateBindings();
			//>EOI CH07
			
		},
		
		handleDeleteAsset: function(oEvent){
			
			var that = this;
			var list = oEvent.getSource().getParent().getParent();
			var selectedData = list.getSelectedItems();
			if(selectedData.length === 0){
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error( this.getView().getModel("i18n").getProperty("Message.Selected1Line"),
					{ styleClass: bCompact ? "sapUiSizeCompact" : "" }
				);
				return;
			}
			
			var prAccAssignmentModel = that.C_MODEL.prAccountAssignment;
			var prAccAssignmentData = $.extend([],prAccAssignmentModel.getData());
			var prItem;
			
			for(var i=0;i<selectedData.length;i++){
				prItem = selectedData[i].getBindingContext("prAccountAssignment").getObject().BNFPO;
				var itemNumber = selectedData[i].getBindingContext("prAccountAssignment").getObject().ZEBKN;
				var idx = that.findIndexAcc(itemNumber,prAccAssignmentData);
				prAccAssignmentData.splice(idx, 1);
			}
			
			// Re-run index number
			//BOD CH07
			// for(var j=0;j<prAccAssignmentData.length;j++){
			// 	var index = j + 1;
			// 	if(index < 10){
			// 		prAccAssignmentData[j].ZEBKN = "0" + index;
			// 	}else{
			// 		prAccAssignmentData[j].ZEBKN = "" + index;
			// 	}
			// }
			//EOD CH07
			
			that.C_MODEL.prAccountAssignment.setData([]);
			that.C_MODEL.prAccountAssignment.setData(prAccAssignmentData);
			that.C_MODEL.prAccountAssignment.updateBindings();
			list.removeSelections();
			
			// Sync back
			var prItemModel = that.getOwnerComponent().getModel("prItem");
			var prItemData = prItemModel.getProperty("/");
			for(var i=0;i<prItemData.length;i++){
				if(parseInt(prItemData[i].BNFPO,0) === parseInt(prItem,0)){
					prItemData[i].PrAccAssignment.results = [];
					prItemData[i].PrAccAssignment.results = prAccAssignmentData;
				}
			}
			prItemModel.updateBindings();
			
		},
		
		findIndexAcc: function(itemNumber,prAccData){
			var idx = -1;
			for(var i=0;i<prAccData.length;i++){
				if(parseInt(prAccData[i].ZEBKN,0) === parseInt(itemNumber,0)){
					idx = i;
				}
			}
			return idx;
		},
		
		handleCloseDialog: function (oEvent) {
			this.C_MODEL.prNewAsset.setData({});
			this.C_MODEL.prNewAsset.updateBindings();
			oEvent.getSource().getParent().close();
		},
		
		onAfterShow:function(oEvent){
			var objectPageLayout = this.getView().getContent()[0].getContent()[0];
			var firstSectionId = objectPageLayout.getSections()[0].getId();
			objectPageLayout.setSelectedSection(firstSectionId);
		},
		
		onExit: function () {

			for (var sPropertyName in this._formFragments) {
				if (!this._formFragments.hasOwnProperty(sPropertyName) || this._formFragments[sPropertyName] === null) {
					return;
				}

				this._formFragments[sPropertyName].destroy();
				this._formFragments[sPropertyName] = null;
			}

		}
	});
}, /* bExport= */ true);