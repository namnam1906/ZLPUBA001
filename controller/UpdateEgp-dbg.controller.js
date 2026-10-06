sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"../utilities/Formatter",
	"iam/bc/utilities/ValueHelpCollection",
	"iam/bc/utilities/CommonVHDialog",
	"iam/bc/utilities/Utilities"
], function (BaseController, MessageBox, History, Formatter, ValueHelpCollection, CommonVHDialog, GUtilities) {
	"use strict";

	var oMessageTemplate = new sap.m.MessagePopoverItem({
		type: '{type}',
		title: '{title}',
		description: '{description}',
		subtitle: '{subtitle}',
		groupName: '{groupName}'
	});

	return BaseController.extend("com.cu.s4hana.zlpuba001.controller.PrHeader", {

		formatter: Formatter,

		C_MODEL_NAME: {
			prItem: "prItem",
			prEgpData: "prEgpData",
			prEgpItemList: "prEgpItemList"
		},

		C_MODEL: {
			prHeader: null,
			prItem: null,
			prHeaderText: null,
			prEgpData: null,
			prEgpItemList: null
		},

		isInit: true,
		_formFragments: {},
		aStackUploadDefer: [],
		aUploadItem: [],

		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("UpdateEgp").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.initModel();

			this._MessageManager = new sap.ui.core.message.MessageManager();
			this.getView().setModel(this._MessageManager.getMessageModel(), "message");
			this.getView().addStyleClass("sapUiSizeCompact");

		},

		initModel: function () {

			var prItemModel = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(prItemModel, this.C_MODEL_NAME.prItem);
			this.C_MODEL.prItem = prItemModel;

			var prEgpData = new sap.ui.model.json.JSONModel({});
			this.getView().setModel(prEgpData, this.C_MODEL_NAME.prEgpData);
			this.C_MODEL.prEgpData = prEgpData;

			var prEgpItemList = new sap.ui.model.json.JSONModel({});
			this.getView().setModel(prEgpItemList, this.C_MODEL_NAME.prEgpItemList);
			this.C_MODEL.prEgpItemList = prEgpItemList;

			var prHeaderData = this.getOwnerComponent().getModel("prHeader");
			this.C_MODEL.prHeader = prHeaderData;

			var prHeaderTextData = this.getOwnerComponent().getModel("prHeaderText");
			this.C_MODEL.prHeaderText = prHeaderTextData;

		},

		resetData: function () {

			this.C_MODEL.prItem.setData([]);
			this.getView().getModel(this.C_MODEL_NAME.prItem).setData([]);
			this.C_MODEL.prItem.refresh();

			this.C_MODEL.prEgpData.setData({});
			this.getView().getModel(this.C_MODEL_NAME.prEgpData).setData([]);
			this.C_MODEL.prEgpData.refresh();

			this.C_MODEL.prEgpItemList.setData([]);
			this.getView().getModel(this.C_MODEL_NAME.prEgpItemList).setData([]);
			this.C_MODEL.prEgpItemList.refresh();

			if (this._MessageManager) {
				this._MessageManager.removeAllMessages();
			}

		},

		onExit: function () {
			for (var sPropertyName in this._formFragments) {
				if (!this._formFragments.hasOwnProperty(sPropertyName) || this._formFragments[sPropertyName] === null) {
					return;
				}
				this._formFragments[sPropertyName].destroy();
				this._formFragments[sPropertyName] = null;
			}
		},

		handleRouteMatched: function () {

			var that = this;
			var aDefer = [];

			if (!that.getView().getBusy()) {
				that.getView().setBusyIndicatorDelay(0);
				that.getView().setBusy(true);
			}

			that.initModel();
			that.resetData();

			aDefer.push(that.getMaterialUnitData());
			$.when.apply($, aDefer).then(function (materialUnitData) {
				that.prepareData(materialUnitData);
				if (that.getView().getBusy()) {
					that.getView().setBusy(false);
				}
			});

		},

		getMaterialUnitData: function () {
			var that = this;
			var defer = new $.Deferred();

			var prEgpModel = that.getOwnerComponent().getModel("prEgpData");
			if (prEgpModel) {
				var prEgpData = prEgpModel.getData();
				if (!prEgpData.EGPWS0006 || !prEgpData.EGPWS0007 || !prEgpData.EGPWS0016) {
					return defer.resolve([]);
				}
			} else {
				return defer.resolve([]);
			}

			var aFilters = [];
			for (var i = 0; i < prEgpData.EGPWS0007.product.length; i++) {
				aFilters.push(new sap.ui.model.Filter("EGP_UNIT", "EQ", prEgpData.EGPWS0007.product[i].field12, ""));
			};

			var srvModel = that.getView().getModel();
			var defer = new $.Deferred();
			var path = "/F4EgpUnitSet";
			srvModel.read(path, {
				filters: aFilters,
				success: function (s) {
					defer.resolve(s.results);
				},
				error: function (e) {
					defer.resolve([]);
				}
			});
			return defer;
		},

		prepareData: function (materialUnitData) {

			var prItemData = this.getOwnerComponent().getModel("prItem").getData();
			var prEgpData = this.getOwnerComponent().getModel("prEgpData").getData();
			// var egpSum = 0; //CH12: INS		//CH:12 DEL

			if (prItemData && prEgpData) {

				var arr = [];
				arr.push({
					key: "-",
					text: ""
				});
				for (var i = 0; i < prEgpData.EGPWS0007.product.length; i++) {
					var rec = {
						key: prEgpData.EGPWS0007.product[i].field1,
						text: "[" + prEgpData.EGPWS0007.product[i].field1 + "] " + prEgpData.EGPWS0007.product[i].field11
					};
					arr.push(rec);

					for (var j = 0; j < materialUnitData.length; j++) {
						if (parseInt(prEgpData.EGPWS0007.product[i].field12, 0) === parseInt(materialUnitData[j].EGP_UNIT, 0)) {
							this.getOwnerComponent().getModel("prEgpData").setProperty("/EGPWS0007/product/" + i + "/sapUnit", materialUnitData[j].SAP_UNIT_DESC);
						}
					}

					// egpSum = parseFloat(prEgpData.EGPWS0007.product[i].field24) + egpSum;		//CH12: INS		//CH:12 DEL

				}

				/* CH12: START INS */
				if (typeof(prEgpData.EGPWS0016.projectdetail.field6) === "object") {
					prEgpData.EGPWS0016.projectdetail.field6 = "";
				}
				if (typeof(prEgpData.EGPWS0016.projectdetail.field19) === "object") {
					prEgpData.EGPWS0016.projectdetail.field19 = prEgpData.EGPWS0007.projectid.field1;
				}
				if (typeof(prEgpData.EGPWS0016.projectdetail.field5) === "object") {
					prEgpData.EGPWS0016.projectdetail.field5 = prEgpData.EGP_YEAR;
				}
				if (typeof(prEgpData.EGPWS0016.budgetdetail.field5) === "object") {		
					// prEgpData.EGPWS0016.budgetdetail.field5 = egpSum;		//CH:12 DEL
					prEgpData.EGPWS0016.budgetdetail.field5 = "";			//CH:12 INS					
				}																			
				/* CH12: END INS */

				this.C_MODEL.prEgpItemList.setData([]);
				this.C_MODEL.prEgpItemList.setData(arr);
				this.C_MODEL.prEgpItemList.updateBindings();
				this.getOwnerComponent().getModel("prEgpData").updateBindings();

				arr = [];
				for (i = 0; i < prItemData.length; i++) {
					rec = $.extend({}, prItemData[i]);

					if (rec.LOEKZ !== '') {
						continue;
					}

					if (prEgpData.NO_EGP_FLAG) {
						// if(rec.ZZMMEGP_PROJ === "" && parseInt(rec.ZZMMEGP_ITEM,0) === 0){ DEL BY CH08
						if (rec.ZZMMEGP_PROJ === "" && rec.ZZMMEGP_ITEM === "") { //"++INS  CH08
							arr.push(rec);
						}
					} else {
						arr.push(rec);
					}
				}

				this.C_MODEL.prItem.setProperty("/", arr);
				this.C_MODEL.prEgpData.setProperty("/", prEgpData);
				this.C_MODEL.prItem.updateBindings();
				this.C_MODEL.prEgpData.updateBindings();

			}

		},

		doNavBack: function () {

			var pr = this.C_MODEL.prItem.getProperty("/0/BANFN");
			return new Promise(function (fnResolve) {
				this.doNavigate("PrHeader", "", fnResolve, "", pr, "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},

		handleBackPress: function (oEvent) {

			var that = this;
			sap.m.MessageBox.warning(that.getView().getModel("i18n").getProperty("Message.CancelAssignEgp"), {
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

		onDrop: function (oEvent) {
			var egpModel = this.C_MODEL.prEgpData;
			var egpData = egpModel.getData();
			var oDraggedControl = oEvent.getParameter("draggedControl");
			var oDroppedControl = oEvent.getParameter("droppedControl");

			var dragContext = oDraggedControl.getBindingContext("prEgpData").getObject();
			// var dropContext = oDroppedControl.getBindingContext("prItem").getObject();
			var dropPath = oDroppedControl.getBindingContextPath();

			this.C_MODEL.prItem.setProperty(dropPath + "/ZZMMEGP_PROJ", egpData.EGPWS0016.projectdetail.field19);
			this.C_MODEL.prItem.setProperty(dropPath + "/ZZMMEGP_ITEM", dragContext.field1);
			this.C_MODEL.prItem.updateBindings();

		},

		onDragStart: function (oEvent) {
			this.getView().byId("idPrListEgp").addStyleClass("highlight");
		},

		onDragEnd: function (oEvent) {
			this.getView().byId("idPrListEgp").removeStyleClass("highlight");
		},

		doSelectEgpItem: function (oEvent) {

			var that = this;
			var egpModel = that.C_MODEL.prEgpData;
			var egpData = egpModel.getData();
			var list = that.getView().byId("idPrListEgp");
			var selectedData = list.getSelectedItems();
			// var selectedEgpItem = sap.ui.getCore().byId("idSelectEgpItem").getSelectedKey();
			var selectList = oEvent.getSource().getParent().getContent()[0].getContent()[0].getFormContainers()[0].getFormElements()[0].getFields()[
				0];
			var selectedEgpItem = selectList.getSelectedKey();

			for (var i = 0; i < selectedData.length; i++) {
				var recordPath = selectedData[i].getBindingContext("prItem").getPath();
				that.C_MODEL.prItem.setProperty(recordPath + "/ZZMMEGP_PROJ", egpData.EGPWS0016.projectdetail.field19);
				that.C_MODEL.prItem.setProperty(recordPath + "/ZZMMEGP_ITEM", selectedEgpItem);
				that.C_MODEL.prItem.updateBindings();
			}

			that.onCloseDialogSelectEgp();
			list.removeSelections();
			selectList.setSelectedKey("-");

		},

		handleAssignEgp: function (oEvent) {

			var that = this;
			var list = oEvent.getSource().getParent().getParent();
			var selectedData = list.getSelectedItems();

			if (selectedData.length === 0) {
				var bCompact = !!that.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error(that.getView().getModel("i18n").getProperty("Message.Selected1Line"), {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				});
				return;
			}

			if (!that._oSelectEgpDialog) {
				that._oSelectEgpDialog = sap.ui.xmlfragment("com.cu.s4hana.zlpuba001.view.fragment.SelectEgpItemDialog", that);
			}
			that._oSelectEgpDialog.setModel(that.getView().getModel());
			jQuery.sap.syncStyleClass("sapUiSizeCompact", that.getView(), that._oSelectEgpDialog);
			that.getView().addDependent(that._oSelectEgpDialog);

			that._oSelectEgpDialog.open();

		},

		handleUnAssignEgp: function (oEvent) {

			var that = this;
			var list = oEvent.getSource().getParent().getParent();
			var selectedData = list.getSelectedItems();

			if (selectedData.length === 0) {
				var bCompact = !!that.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error(that.getView().getModel("i18n").getProperty("Message.Selected1Line"), {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				});
				return;
			}

			for (var i = 0; i < selectedData.length; i++) {
				var recordPath = selectedData[i].getBindingContext("prItem").getPath();
				that.C_MODEL.prItem.setProperty(recordPath + "/ZZMMEGP_PROJ", "");
				that.C_MODEL.prItem.setProperty(recordPath + "/ZZMMEGP_ITEM", "");
				that.C_MODEL.prItem.updateBindings();
			}

		},

		onCloseDialogSelectEgp: function (oEvent) {
			this._oSelectEgpDialog.close();
		},

		createDataForSave: function () {

			var userLogin = sap.ushell.Container.getService("UserInfo").getId();
			var prHeaderData = $.extend({}, this.C_MODEL.prHeader.getData());
			var prItemAllData = $.extend([], this.getOwnerComponent().getModel("prItem").getData());
			var prItemData2 = $.extend([], this.C_MODEL.prItem.getData());
			var prHeaderTextData = $.extend([], this.C_MODEL.prHeaderText.getData());
			var prItem = [];
			var prHeaderText = [];
			var prEgpData = this.C_MODEL.prEgpData.getData();

			// Sync PR Item
			var prItemData = [];
			var isFound = false;
			for (var i = 0; i < prItemAllData.length; i++) {
				isFound = false;
				for (var j = 0; j < prItemData2.length; j++) {
					if (parseInt(prItemAllData[i].BNFPO, 0) === parseInt(prItemData2[j].BNFPO, 0)) {
						prItemData.push(prItemData2[j]);
						isFound = true;
					}
				}
				if (!isFound) {
					prItemData.push(prItemAllData[i]);
				}
			}

			// PR header text
			for (var i = 0; i < prHeaderTextData.length; i++) {
				var hdTextData = $.extend({}, prHeaderTextData[i]);
				var hdText = {};
				hdText.BANFN = hdTextData.BANFN;
				hdText.TDID = hdTextData.TDID;
				hdText.DETAIL = hdTextData.DETAIL;
				prHeaderText.push(hdText);
			}

			// PR item data
			for (var i = 0; i < prItemData.length; i++) {

				var it = $.extend({}, prItemData[i]);

				var record = {};
				record.BANFN = "" + it.BANFN;
				record.BNFPO = "" + it.BNFPO;
				record.MATNR = it.MATNR;
				record.TXZ01 = it.TXZ01;
				record.MATKL = it.MATKL;
				record.EKGRP = it.EKGRP;
				record.LIFNR = it.LIFNR;
				record.AFNAM = it.AFNAM;
				record.BEDNR = it.BEDNR;
				record.WERKS = it.WERKS;
				record.LGORT = it.LGORT;
				record.KNTTP = it.KNTTP;
				record.ZZMMEGP_PROJ = it.ZZMMEGP_PROJ;
				record.ZZMMEGP_ITEM = it.ZZMMEGP_ITEM;
				// record.ZZMMEGP_YEAR = prEgpData.EGPWS0016.projectdetail.field5;			//CH12: DEL
				/* CH12 START INS */
				if (typeof(prEgpData.EGPWS0016.projectdetail.field5) !== "object") {
					record.ZZMMEGP_YEAR = prEgpData.EGPWS0016.projectdetail.field5;
				} else {
					record.ZZMMEGP_YEAR = prEgpData.EGP_YEAR;
				}
				/* CH12 END INS */
				record.ZZMM_NO_ESIGN = it.ZZMM_NO_ESIGN; //++CH08

				record.PSTYP = it.PSTYP;
				if (it.PSTYP === 'D') {
					record.PSTYP = 'D';
					record.COMMITMENT = "" + it.COMMITMENT;
					record.SUMLIMIT = "" + it.SUMLIMIT;
					if (it.NOLIMIT) {
						record.NOLIMIT = 'X';
					} else {
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
				// record.LOEKZ = it.LOEKZ;

				if (it.LOEKZ) {
					record.LOEKZ = 'X';
				} else {
					record.LOEKZ = '';
				}

				if (record.OLD) {
					delete record.OLD;
				}

				record.PrAccAssignment = [];
				if (record.KNTTP === "" || record.KNTTP === "-") {
					record.KNTTP = "";
					record.GEBER = it.GEBER;
					record.FKBER = it.FKBER;
					record.FISTL = it.FISTL;
					record.FIPOS = it.FIPOS;
					record.KBLNR = it.KBLNR;
					record.KBLPOS = it.KBLPOS;
					record.BWTAR = it.BWTAR;
				} else {

					if (prItemData[i].PrAccAssignment.results) {

						for (var j = 0; j < prItemData[i].PrAccAssignment.results.length; j++) {

							var itAcc = $.extend({}, prItemData[i].PrAccAssignment.results[j]);
							itAcc = this.convertUndefinedValue(itAcc);
							var recordAcc = {};
							recordAcc.BANFN = "" + itAcc.BANFN;
							recordAcc.BNFPO = "" + itAcc.BNFPO;
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
							if (recordAcc.SCHRW_PROZ) {
								recordAcc.SCHRW_PROZ = "" + recordAcc.SCHRW_PROZ;
							} else {
								recordAcc.SCHRW_PROZ = "0";
							}

							recordAcc.AFASL = itAcc.AFASL;
							recordAcc.AUFNR = itAcc.AUFNR;

							recordAcc.GSBER = itAcc.GSBER;
							if (itAcc.ANLN1 === "NEW") {
								recordAcc.ANLN1 = "";
							} else {
								recordAcc.ANLN1 = itAcc.ANLN1;
							}
							recordAcc.ANLN2 = itAcc.ANLN2;
							recordAcc.MENGE = "" + itAcc.MENGE;

							recordAcc = this.convertUndefinedValue(recordAcc);
							record.PrAccAssignment.push(recordAcc);

						}

					}

				}

				record.PrItemText = [];
				if (prItemData[i].PrItemText.results) {

					for (var j = 0; j < prItemData[i].PrItemText.results.length; j++) {

						var itText = $.extend({}, prItemData[i].PrItemText.results[j]);
						var recordText = {};
						recordText.BANFN = "" + it.BANFN;
						recordText.BNFPO = "" + it.BNFPO;
						recordText.TDID = itText.TDID;
						recordText.DETAIL = itText.DETAIL;

						record.PrItemText.push(recordText);

					}

				}

				prItem.push(record);

			}

			// PR header data
			var prHeader = {};
			prHeader.BANFN = "" + prHeaderData.BANFN;
			prHeader.BSART = prHeaderData.BSART;
			prHeader.REQ_NR = prHeaderData.REQ_NR;

			// Associations
			prHeader.PrItem = prItem;
			prHeader.PrHeaderText = prHeaderText;

			prHeader = GUtilities.AdjustDateTimeDataToSend(prHeader);
			return prHeader;

		},

		handleChangeSelectEgpItem: function (oEvent) {

			var egpModel = this.C_MODEL.prEgpData;
			var egpData = egpModel.getData();
			var path = oEvent.getSource().getBindingContext("prItem").getPath();
			var selectedKey = oEvent.getParameters().selectedItem.getKey();

			if (selectedKey === "-") {
				this.C_MODEL.prItem.setProperty(path + "/ZZMMEGP_PROJ", "");
				this.C_MODEL.prItem.setProperty(path + "/ZZMMEGP_ITEM", "");
			} else {
				this.C_MODEL.prItem.setProperty(path + "/ZZMMEGP_PROJ", egpData.EGPWS0016.projectdetail.field19);
				this.C_MODEL.prItem.setProperty(path + "/ZZMMEGP_ITEM", selectedKey);
			};

			this.C_MODEL.prItem.updateBindings();

		},

		convertUndefinedValue: function (object) {

			for (var key in object) {
				if (object.hasOwnProperty(key)) {
					if (object[key] === undefined) {
						object[key] = "";
					}
				}
			}

			return object;

		},

		validateDataForSave: function (prItemByEgp) {

			// var isSuccess = true;
			var oButton = this.getView().byId("idUpdateEgpPage").getFooter().getContent()[0];
			var prEgpData = this.C_MODEL.prEgpData.getData();
			var prItemData = this.C_MODEL.prItem.getData();
			var egpTotal = 0;
			var egpPr = 0;
			var prNotDup = [];

			this._MessageManager = new sap.ui.core.message.MessageManager();
			this.getView().setModel(this._MessageManager.getMessageModel(), "message");
			this.createMessagePopover();

			// // Total e-GP Value for e-GP
			// for (var i = 0; i < prEgpData.EGPWS0007.product.length; i++) {
			// 	egpTotal = egpTotal + parseFloat(prEgpData.EGPWS0007.product[i].field25,0);
			// }

			// // Total e-GP Value for all PRs + current Assigned PR
			// for (i = 0; i < prItemData.length; i++) {
			// 	var	recPr = prItemData[i];
			// 	if(recPr.ZZMMEGP_PROJ !== '' && parseInt(recPr.ZZMMEGP_ITEM,0) !== 0){
			// 		egpPr = egpPr + parseFloat(recPr.RLWRT,0);
			// 	}
			// }
			// for (i = 0; i < prItemByEgp.length; i++) {
			// 	recPr = prItemByEgp[i];

			// 	var isFound = false;
			// 	for (var j = 0; j < prItemData.length; j++) {
			// 		var	rec = prItemData[j];
			// 		if(recPr.BANFN === rec.BANFN && recPr.BNFPO === rec.BNFPO){
			// 			isFound = true;
			// 			break;
			// 		}
			// 	}

			// 	if(!isFound){
			// 		prNotDup.push(recPr);
			// 		egpPr = egpPr + parseFloat(recPr.RLWRT,0);
			// 	}
			// }

			// var egpDif = egpPr - egpTotal;
			// if(egpDif > 0){

			// 	var lvErrorDesc = "รายการ PR:\r\n";
			// 	for (i = 0; i<prNotDup.length; i++) {
			// 		if(lvErrorDesc !== "รายการ PR:\r\n"){
			// 			lvErrorDesc = lvErrorDesc + "\r\n";
			// 		}
			// 		lvErrorDesc = lvErrorDesc + prNotDup[i].BANFN + " / " + this.formatter.parseInt(prNotDup[i].BNFPO) + " (" + this.formatter.parseValue(prNotDup[i].RLWRT) + " " + prNotDup[i].WAERS + ")";
			// 	}

			// 	this._MessageManager.addMessages(
			// 		new sap.ui.core.message.Message({
			// 			code: "",
			// 			message: this.getView().getModel("i18n").getResourceBundle().getText("Message.ErrorEgpValue",["" + this.formatter.parseValue(egpDif)]),
			// 			type: "Error",
			// 			additionalText: "e-GP",
			// 			description: lvErrorDesc
			// 		})
			// 	);

			// 	setTimeout(function(){
			// 		this.oMP.openBy(oButton);
			// 	}.bind(this), 100);

			// 	return false;
			// }else{
			// 	return true;	
			// }

			return true;

		},

		handleSaveEgpPress: function () {
			var aDefer = [];
			var that = this;
			aDefer.push(that.getPrItemByEgp());
			$.when.apply($, aDefer).then(function (prItemByEgp) {
				that.doSaveEgpPress(prItemByEgp);
			});
		},

		getPrItemByEgp: function () {
			var srvModel = this.getView().getModel();
			var defer = new $.Deferred();
			var path = "/PrItemSet";
			var aFilters = [];
			var that = this; //++CH08
			that.getView().setBusy(true); //++CH08
			aFilters.push(new sap.ui.model.Filter("ZZMMEGP_PROJ", "EQ", this.C_MODEL.prEgpData.getProperty("/EGPWS0016/projectdetail/field19"),
				""));
			srvModel.read(path, {
				filters: aFilters,
				success: function (s) {

					var arr = [];
					for (var i = 0; i < s.results.length; i++) {
						var rec = s.results[i];
						if (rec.LOEKZ === '') {
							arr.push(rec);
						}
					}
					defer.resolve(arr);
				},
				error: function (e) {
					defer.resolve();
			        that.getView().setBusy(false); //++CH08
				}
			});
			return defer;
		},

		doSaveEgpPress: function (prItemEgp) {

			var that = this;
			var oButton = this.getView().byId("idUpdateEgpPage").getFooter().getContent()[0];

			if (this.validateDataForSave(prItemEgp)) {

				that.getView().setBusy(true); //++CH08
				var dataForSave = that.createDataForSave();

				that.getView().setBusyIndicatorDelay(0);
				that.getView().setBusy(true);

				var serviceUrl = that.oView.getModel().sServiceUrl;
				var odataServiceModel = new sap.ui.model.odata.v2.ODataModel(serviceUrl);
				var pr = dataForSave.BANFN;
				odataServiceModel.refreshSecurityToken();

				// that._MessageManager.removeAllMessages();

				odataServiceModel.create("/PrHeaderSet", dataForSave, {
					success: function (s) {
						if (that.getView().getBusy() === true) {
							that.getView().setBusy(false);
						};
						that.prepareMessageSaveSuccess(pr);
                        var wMsg = s.PrHeaderText.results.find(e => e.TDID === "W").TITLE;//++CH10
                        MessageBox.warning(wMsg);                                         //++CH10
						that.getView().setBusy(false); //++CH08
					},
					error: function (e) {
						if (that.getView().getBusy() === true) {
							that.getView().setBusy(false);
						};
						that.errorHandlingCreate(e);
						setTimeout(function () {
							that.oMP.openBy(oButton);
						}.bind(that), 100);

						that.getView().setBusy(false); //++CH08
					}
				});

			};

		},

		prepareMessageSaveSuccess: function (pPr) {

			var that = this;
			var msg = "";
			var icon = "";
			var title = "";
			msg = that.getView().getModel("i18n").getResourceBundle().getText("Message.AssignEgpToPrSuccess", [pPr]);
			icon = sap.m.MessageBox.Icon.SUCCESS;
			title = that.getView().getModel("i18n").getResourceBundle().getText("Message.SuccessTitle");
			MessageBox.show(msg, {
				icon: icon,
				title: title,
				onClose: function (oAction) {
					that.doNavBack();
				}
			});

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

		convertErrorFormat: function (arrErrors) {
			for (var i in arrErrors) {
				arrErrors[i].MESSAGE = arrErrors[i].message;
			}
		},

		deleteDuplicateRecords: function (arrErrors) {
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

		isHasData: function (input) {
			if (this.isNullOrBlank(input)) {
				return false;
			} else {
				return true;
			}
		},

		isNullOrBlank: function (e) {
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
				if (!this.isHasData(lvArrError[i]["MESSAGE"]) || lvArrError[i]["code"] === "/IWBEP/CX_MGW_TECH_EXCEPTION" || lvArrError[i][
						"MESSAGE"
					] === "Return") {
					continue;
				}
				lvCurrentType = "";
				if (lvArrError[i]["severity"] === "warning") {
					lvCurrentType = sap.ui.core.MessageType.Warning;
				} else if (lvArrError[i]["severity"] === "info") {
					lvCurrentType = sap.ui.core.MessageType.Information;
				} else {
					lvCurrentType = sap.ui.core.MessageType.Error;
				}

				if (lvArrError[i]["code"][0] === "Z") {
					lvCode = lvArrError[i]["code"];
					lvType = "Error";
					if (i !== 0 && lvLastCode && lvLastCode !== lvArrError[i]["code"]) {
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
					} else {
						if (lvTitle) {

							if (lvMsg) {
								lvMsg = lvMsg + "\r\n" + lvArrError[i]["MESSAGE"];
							} else {
								lvMsg = lvArrError[i]["MESSAGE"];
							}
						} else {
							lvTitle = lvArrError[i]["MESSAGE"];
						}
					};
					lvLastCode = lvArrError[i]["code"];
				} else {

					if (lvTitle) {
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

			if (lvTitle) {
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

		},

		getGroupName: function (code) {
			if (code) {
				return code;
			} else {
				return "";
			}
		},

		isPositionable: function (target) {
			if (target) {
				return true;
			} else {
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

		createMessagePopover: function () {
			var that = this;
			this.oMP = new sap.m.MessagePopover({
				items: {
					path: "message>/",
					template: new sap.m.MessageItem({
						title: "{message>message}",
						subtitle: "{message>additionalText}",
						groupName: {
							parts: [{
								path: 'message>code'
							}],
							formatter: this.getGroupName
						},
						activeTitle: {
							parts: [{
								path: 'message>target'
							}],
							formatter: this.isPositionable
						},
						type: "{message>type}",
						description: "{message>description}"
					})
				}
			});

			this.oMP._oMessageView.setGroupItems(true);
			var msgPopover = this.getView().byId("idUpdateEgpPage").getFooter().getContent()[0];
			msgPopover.addDependent(this.oMP);
		},

	});
}, /* bExport= */ true);