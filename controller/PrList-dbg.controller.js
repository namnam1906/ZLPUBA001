sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"../utilities/Formatter",
	"../utilities/Utilities",
	"iam/bc/utilities/ValueHelpCollection",
	"iam/bc/utilities/Utilities",
	"iam/bc/utilities/CommonVHDialog"
], function (BaseController, MessageBox, History, Formatter, LocalUtilities, ValueHelpCollection, GUtilities, CommonVHDialog) {
	"use strict";
	
	var oMessageTemplate = new sap.m.MessagePopoverItem({
		type: '{type}',
		title: '{title}',
		description: '{description}',
		subtitle: '{subtitle}',
		groupName: '{groupName}'
	});

	return BaseController.extend("com.cu.s4hana.zlpuba001.controller.PrList", {
		
		isInit: true,
		formatter: Formatter,
        _criterias: [{
            id: "idPrNo",
            keyfield: "BANFN",
            type: "MultiInput",
            control: null
        }, {
            id: "idPrDocType",
            keyfield: "BSART",
            type: "MultiInput",
            control: null
        }, {
            id: "idPlant",
            keyfield: "WERKS",
            type: "MultiInput",
            control: null
        }, {
            id: "idMaterial",
            keyfield: "MATNR",
            type: "MultiInput",
            control: null
        }, {
            id: "idShortText",
            keyfield: "TXZ01",
            type: "MultiInput",
            control: null
        }, {
            id: "idMaterialGroup",
            keyfield: "MATKL",
            type: "MultiInput",
            control: null
        }, {
            id: "idPurchasingGroup",
            keyfield: "EKGRP",
            type: "MultiInput",
            control: null
        }, {
            id: "idFundCenter",
            keyfield: "FISTL",
            type: "MultiInput",
            control: null
        }, {
            id: "idFund",
            keyfield: "GEBER",
            type: "MultiInput",
            control: null
        }, {
            id: "idAccountAssignment",
            keyfield: "KNTTP",
            type: "MultiComboBox",
            control: null
        }, {
            id: "idCreateBy",
            keyfield: "ERNAM",
            type: "MultiInput",
            control: null
        }, {
            id: "idCreateDate",
            keyfield: "BADAT",
            type: "DateRange",
            control: null
        }, {
            id: "idStatus",
            keyfield: "STATUS",
            type: "MultiComboBox",
            control: null
        }],
        C_MODEL_NAME: {
			prEgpInfo: "prEgpInfo",
			prEgpData: "prEgpData",
			errorsEgp: "errorsEgp",
			controlModel: "controlModel",
			userParam: "userParam"
		},
		
		C_MODEL: {
			prEgpInfo: null,
			prEgpData: null,
			errorsEgp: null,
			controlModel: null,
			userParam: null
		},
        
        onInit: function () {
        	
        	var that = this;
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("PrList").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

            this.settingScreenCriteria();
            LocalUtilities.addValidator(this._criterias);
          
		},
		
		getUserParameters: function() {

				
			var defer = new $.Deferred();
			var lvUser = "";
			var srvModel = this.getOwnerComponent().getModel();
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
		
		settingScreenCriteria: function () {
            for (var lvFname in this._criterias) {
                this._criterias[lvFname].control = this.getView().byId(this._criterias[lvFname].id);
            }
            
            var oSmartTable = this.getView().byId("idSmartTablePrList");            
	        oSmartTable.applyVariant({
	             sort: {
	                      sortItems: [{ 
	                                     columnKey: "BADAT", 
	                                     operation:"Descending"},
	                                  { 
	                                     columnKey: "BANFN", 
	                                     operation:"Descending"}
	                                 ]
	                   }
	        });
        
        },
		
		handleRouteMatched: function (oEvent) {
			
			if(this.isInit){
				
				this.initModel();
				this.initialScreen();
	            this.setDefaultValue();
	            
	            var aDefer = [];
				aDefer.push(this.getUserParameters());
				$.when.apply($, aDefer).then(function (status) {
					
					var userParam = this.C_MODEL.userParam.getData();
					
					// Default Plant
					if(userParam.WERKS){
						var oToken = GUtilities.CreateToken(false, "WERKS", "EQ", userParam.WERKS);
						this.getView().byId("idPlant").setTokens([oToken]);
					}
					
					this.getView().byId("idSmartTablePrList").rebindTable(true);
					
				}.bind(this));
	            
			}else{
				
				this.isInit = true;
				this.getView().byId("idSmartTablePrList").rebindTable(true);
				
			}
		},
		initModel: function () {
			
			var prEgpInfo = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(prEgpInfo, this.C_MODEL_NAME.prEgpInfo);
			this.C_MODEL.prEgpInfo = prEgpInfo;
			
			var prEgpData = new sap.ui.model.json.JSONModel({});
			this.getOwnerComponent().setModel(prEgpData, this.C_MODEL_NAME.prEgpData);
			this.C_MODEL.prEgpData = prEgpData;

			var errorsEgp = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(errorsEgp, this.C_MODEL_NAME.errorsEgp);
			this.C_MODEL.errorsEgp = errorsEgp;
			
			var controlModel = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(controlModel, this.C_MODEL_NAME.controlModel);
			this.C_MODEL.controlModel = controlModel;
			
			var userParam = new sap.ui.model.json.JSONModel([]);
			this.getView().setModel(userParam, this.C_MODEL_NAME.userParam);
			this.C_MODEL.userParam = userParam;

		},
		initialScreen: function () {
            var loSmtFilter = this.getView().byId("smartFilterBar");
            if (loSmtFilter) loSmtFilter.clear();
            if (!this.oVHCollection) this.oVHCollection = new ValueHelpCollection(this.getView().getModel());
        },
        setDefaultValue: function () {
            // var lsInitCompCode = "1100";
            // var loToken = LibUtilities.CreateToken(false, "EzPayComCode_S", "EQ", lsInitCompCode);
            // var loControl = this.getView().byId("idEzPayComCode");
            // loControl.setTokens([loToken]);
            // this.setCompCode(lsInitCompCode);
            
        	var dateSelectControl = this.getView().byId("idDatePeriod");
        	var dateRangeControl = this.getView().byId("idCreateDate");
        	
        	dateSelectControl.setSelectedKey("1M");
        	dateRangeControl.setEnabled(false);
            
        },
        
        onChangeDatePeriod: function(oEvent){
        	var dateRangeControl = this.getView().byId("idCreateDate");
        	var selectedPeriod = oEvent.getParameters().selectedItem.getProperty("key");
        	if(selectedPeriod === "-"){
        		dateRangeControl.setEnabled(true);
	        	//<BOI CH05
	            // var currentDate = new Date();
	            // var lv_date = dateRangeControl.getDateValue();
	            // if(lv_date == null){
	            // 	dateRangeControl.setDateValue(currentDate);
	            // }
	            this.chkDateRange();
	            //>EOI CH05
        	}else{
        		dateRangeControl.setEnabled(false);
        		dateRangeControl.setDateValue(null);
        	}
        },
        
	        	//<BOI CH05
        chkDateRange:function(){
	        var lv_prno = this.getView().byId("idPrNo").getTokens();
	        var lv_prdoctype = this.getView().byId("idPrDocType").getTokens();
	        var lv_plant = this.getView().byId("idPlant").getTokens();
	        var lv_mat = this.getView().byId("idMaterial").getTokens();
	        var lv_tx = this.getView().byId("idShortText").getTokens();
	        var lv_matgroup = this.getView().byId("idMaterialGroup").getTokens();
	        var lv_purgroup = this.getView().byId("idPurchasingGroup").getTokens();
	        var lv_fundcenter = this.getView().byId("idFundCenter").getTokens();
	        var lv_fund = this.getView().byId("idFund").getTokens();
	        var lv_acc = this.getView().byId("idAccountAssignment").getSelectedKeys();
	        var lv_create = this.getView().byId("idCreateBy").getTokens();
        	var lv_dateRangeControl = this.getView().byId("idCreateDate").getDateValue();
	        var lv_status = this.getView().byId("idStatus").getSelectedKeys();
	        var currentDate = new Date();
            if( lv_prno.length == 0 && lv_prdoctype.length == 0
              && lv_plant.length == 0 && lv_mat.length == 0 && lv_tx.length == 0
              && lv_tx.length == 0 && lv_matgroup.length == 0 && lv_purgroup.length == 0
              && lv_fundcenter.length == 0 && lv_fund.length == 0 && lv_acc == ""
              && lv_create.length == 0 && lv_status == "" && lv_dateRangeControl == null){
            	this.getView().byId("idCreateDate").setDateValue(currentDate);
             }


        },
	            //>EOI CH05
        checkDateFormat: function(oEvent) {
        	var dateSelectControl = this.getView().byId("idDatePeriod");
			var bValid = oEvent.getParameter("valid");
			var oDRS = oEvent.getSource();
			if (bValid) {
				oDRS.setValueState(sap.ui.core.ValueState.None);
				
				if(!oEvent.getSource().getDateValue()){
	        		dateSelectControl.setEnabled(true);
	        	}else{
	        		dateSelectControl.setEnabled(false);
	        		dateSelectControl.setSelectedKey("-");
	        	}
				
			} else {
				oDRS.setValueState(sap.ui.core.ValueState.Error);
			}
		},
        
        onbeforeRebindTable: function (oEvent) {
            var mBindingParams = oEvent.getParameter("bindingParams");
            this.adjustDateFilter(mBindingParams.filters);
            var loFilters = this.getFilterBar(mBindingParams.filters);
            mBindingParams.filters = loFilters;
        },
        
		onVHPrNo: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4PR(
                loControl,
                true,
                true,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHPlant: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4Plant(
                loControl,
                true,
                false,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHPrDocType: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4PrDocType(
                loControl,
                true,
                false,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHMaterial: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4Material(
                loControl,
                true,
                false,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHPrItemShortText: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4PrItemShortText(
                loControl,
                true,
                true,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHMaterialGroup: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4MaterialGroup(
                loControl,
                true,
                false,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHPurchasingGroup: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4PurchasingGroup(
                loControl,
                true,
                false,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHFundCenter: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4FundCenter(
                loControl,
                true,
                false,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHFund: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4Fund(
                loControl,
                true,
                false,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        onVHCreateBy: function (oEvent) {
            var loControl = oEvent.getSource();
            var laTokens = loControl.getTokens();
            this.oVHCollection.callF4SapUserName(
                loControl,
                true,
                false,
                laTokens,
                "TEXT",
                function (pControlEvent, pTokens, pDataSet, pSelected) {
                    var oToken = pTokens;
                    loControl.setTokens(oToken);
                    // loControl.setTokens(GUtilities.RetrieveToken("WERKS", pControlEvent.getParameters().tokens));
                }.bind(this)
            );
        },
        
        getFilterBar: function (pFilterParam) {
            var laFilters = [];
            var loSmtFilter = this.getView().byId("smartFilterBar");
            for (var i in this._criterias) {
                if (this._criterias[i].control) {
                    var loSelect = loSmtFilter.getControlByKey(this._criterias[i].keyfield);
                    if (!loSelect) {
                        continue;
                    }
                    switch (this._criterias[i].type) {
                        case "MultiInput":
                            var laSubIndvFilters = [];
                            var laTokens = loSelect.getTokens();
                            if (laTokens.length > 0) {
                                for (var lvInd in laTokens) {
                                    var loToken = laTokens[lvInd];
                                    var loFilter;
                                    if (loToken.getCustomData().length > 0) {
                                        var loRange = loToken.data("value");
                                        loFilter = new sap.ui.model.Filter(
                                            // loRange.keyField,
                                            this._criterias[i].keyfield,
                                            (loRange.exclude ? "NE" : loRange.operation),
                                            loRange.value1,
                                            loRange.value2
                                        );
                                    } else {
                                        loFilter = new sap.ui.model.Filter(
                                            lvFname,
                                            "EQ",
                                            loToken.getKey()
                                        );
                                    }
                                    laSubIndvFilters.push(loFilter);
                                }
                            }
                            if (laSubIndvFilters.length > 0) {
                                var loField = this._criterias[i].keyfield;
                                var loParamFilter = pFilterParam.filter(function (val) {
                                    return val.sPath === loField;
                                });
                                if (loParamFilter.length > 0) {
                                    laSubIndvFilters.concat(loParamFilter);
                                    pFilterParam = pFilterParam.filter(function (val) {
                                        return val.sPath !== loField;
                                    });
                                }
                                var loIndvFilter = new sap.ui.model.Filter(laSubIndvFilters, false);
                                laFilters.push(loIndvFilter);
                            }
                            break;
                        case "Input":
                            var loValue = loSelect.getSelectedKey();
                            laFilters.push(new sap.ui.model.Filter(this._criterias[i].keyfield, "EQ", loValue));
                            break;
                        case "DateRange":
                            var lvFname = this._criterias[i].keyfield;
                            var lvDateFrom = loSelect.getFrom();
                            var lvDateTo = loSelect.getTo();
                            
                            if(!lvDateTo){
								lvDateTo = lvDateFrom;
							}
                            
                            if (lvDateFrom && lvDateTo) {
                            	var loFilterDate = new sap.ui.model.Filter(
                                        lvFname,
                                        "BT",
                                        lvDateFrom,
                                        lvDateTo
                                    );
                             //   lvDateFrom.setFullYear(lvDateFrom.getFullYear() - 543);
	                            // lvDateTo.setFullYear(lvDateTo.getFullYear() - 543);  
                            	loFilterDate = GUtilities.AdjustDateTimeDataToSend(loFilterDate);
								laFilters.push(loFilterDate);	
                            }else{
                            	
                            	var selectedPeriod = this.getView().byId("idDatePeriod").getSelectedKey();
                            	
                            	if(selectedPeriod !== '-'){
                            		
                            		var month = 0;
                            		switch (selectedPeriod) {
                            			case "1M":
                            				month = 1;
                            				break;
                            			case "2M":
                            				month = 2;
                            				break;
                            			case "3M":
                            				month = 3;
                            				break;
                            			default:
                            		}
                            	
	                            	lvDateFrom = new Date();
	                            	lvDateFrom.setMonth(lvDateFrom.getMonth() - month);
	                            	lvDateTo = new Date();
	                            	lvDateFrom.setHours(7,0,0,0);
	                            	lvDateTo.setHours(7,0,0,0);
	                            	
	                            	var loFilterDate = new sap.ui.model.Filter(
	                                        lvFname,
	                                        "BT",
	                                        lvDateFrom,
	                                        lvDateTo
	                                    );
	                                // lvDateFrom.setFullYear(lvDateFrom.getFullYear() - 543);
	                                // lvDateTo.setFullYear(lvDateTo.getFullYear() - 543);  
	                            	loFilterDate = GUtilities.AdjustDateTimeDataToSend(loFilterDate);
									laFilters.push(loFilterDate);	
								
                            	}
                            }
                            
                            break;
                    	case "MultiComboBox":
							var lvFname = this._criterias[i].keyfield;
							var laTokens = [];
							var laSubIndvFilters = [];
							laTokens = this._criterias[i].control.getSelectedKeys();
							if (laTokens.length > 0) {
								for (var i in laTokens) {
									
									var lvToken = laTokens[i];
									if(lvFname === "KNTTP" && laTokens[i] === '-'){
										lvToken = ' ';
									}
									
									var loFilter = new sap.ui.model.Filter(
										lvFname,
										"EQ",
										lvToken
									);
									laSubIndvFilters.push(loFilter);
								}
							}
							if (laSubIndvFilters.length > 0) {
								var loIndvFilter = new sap.ui.model.Filter(laSubIndvFilters, false);
								laFilters.push(loIndvFilter);
							}
							break;
                    }
                    ;
                }
            }
            // Get Smarttable header column/TablePersonalisation dialog filter
            if (pFilterParam.length > 0) {
                laFilters.push(new sap.ui.model.Filter(pFilterParam, true));
            }
            // Push all filter together
            var laAllFilter;
            // if (laFilters.length > 0 && laFilters[0] && laFilters[0].aFilters.length > 0) {
            if (laFilters.length > 0 && laFilters[0]) {
                var laSubFilter = new sap.ui.model.Filter(laFilters, true);
                // return laSubFilter;
                laAllFilter = laSubFilter;
            } else {
                laAllFilter = laFilters;
            }
            return laAllFilter;
        },
        
        adjustDateFilter: function (aSearchFilter) {
            for (var i in aSearchFilter) {
                if (aSearchFilter[i] && aSearchFilter[i].aFilters && aSearchFilter[i].aFilters.length > 0) {
                    LocalUtilities.adjustTimezone(aSearchFilter[i].aFilters);
                }
            }
        },

		onPrListPress: function (oEvent) {
			
			this.isInit = false;

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();
			var Pr = oBindingContext.getObject().BANFN;

			return new Promise(function (fnResolve) {
				this.doNavigate("PrHeader", oBindingContext, fnResolve, "", Pr);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		
		handleCreateNewPr: function (oEvent) {

			// var oBindingContext = oEvent.getParameter("listItem").getBindingContext();
			// var Pr = oBindingContext.getObject().BANFN;
			
			this.isInit = false;
			this.getOwnerComponent().getModel("prEgpData").setData({});
			this.getOwnerComponent().getModel("prEgpData").updateBindings();
			return new Promise(function (fnResolve) {
				this.doNavigate("PrNewHeader", "", fnResolve, "", "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		
		clearErrorLogEgp: function () {
			if (this.oMessagePopoverEgp) {
				this.oMessagePopoverEgp.close();
			}
			this.C_MODEL.controlModel.setProperty("/VISIBLE", false);
			this.C_MODEL.controlModel.setProperty("/ERROR_NUM", 0);
			this.C_MODEL.errorsEgp.setProperty("/", []);
			
			var egpInfo = {
				EGP_NO: '',
				EGP_YEAR: '',
				BSART: '',
				WERKS: '',
				EKGRP: ''
			}
			this.C_MODEL.prEgpInfo.setProperty("/", egpInfo);
			this.C_MODEL.controlModel.updateBindings();
			this.C_MODEL.errorsEgp.updateBindings();
			this.C_MODEL.prEgpInfo.updateBindings();
		},
		
		handleCreateRefEgp: function(oEvent){
			
			this.isInit = false;
			this.clearErrorLogEgp();
			
			var userParam = this.C_MODEL.userParam;
			if(userParam){
				if(userParam.getData().WERKS !== ""){
					this.C_MODEL.prEgpInfo.setProperty("/WERKS",userParam.getData().WERKS);
					this.C_MODEL.prEgpInfo.setProperty("/WERKS_NAME",userParam.getData().NAME1);
					this.C_MODEL.prEgpInfo.updateBindings();
				}
			}

			if (!this._oEgpDialog) {
				this._oEgpDialog = sap.ui.xmlfragment("com.cu.s4hana.zlpuba001.view.fragment.EgpDialog", this);
			}
			this._oEgpDialog.setModel(this.getView().getModel());
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oEgpDialog);
			this.getView().addDependent(this._oEgpDialog);

			this._oEgpDialog.open();
			
		},
		
		handleCopyPr: function (oEvent) {
			
			this.isInit = false;
			var Pr = oEvent.getSource().getParent().getParent().getBindingContext().getObject().BANFN;

			return new Promise(function (fnResolve) {
				this.doNavigate("PrNewHeader", "", fnResolve, "", Pr);
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		
		handlePrintPr: function(oEvent){
			
			var pr = oEvent.getSource().getParent().getParent().getBindingContext().getObject().BANFN;
			
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					// shellHash: "ZFIORI-ZLPUBA106_NAV?sap-ui-tech-hint=GUI&sap-language=TH&PR=" + pr 
					shellHash: "ZFIORI-ZLPUBA106_NAV&/PrintPr/" + pr 
				}
			}));
			var url = window.location.href.split('#')[0] + hash;
			sap.m.URLHelper.redirect(url, true);
			
		},
		
		doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation, Pr) {
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
					case "PrNewHeader":
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
		
		doCreatePrRefEgp: function(oEvent){
			
			var that = this;
			var aDefer = [];
			var oButton = oEvent.getSource().getParent().getButtons()[0];
			
			var EgpDialog = oEvent.getSource().getParent();
			if (EgpDialog.getBusy() === false) {
				EgpDialog.setBusyIndicatorDelay(0);
				EgpDialog.setBusy(true);
			}
			
			aDefer.push(that.callEgpService("EGPWS0016"));
			aDefer.push(that.callEgpService("EGPWS0006"));
			aDefer.push(that.callEgpService("EGPWS0007"));
			
			that.C_MODEL.errorsEgp.setProperty("/", []);
			that.C_MODEL.errorsEgp.updateBindings();
			
			$.when.apply($, aDefer).then(function (status1, status2, status3) {
				
				if (EgpDialog.getBusy() === true) {
					EgpDialog.setBusy(false);
				}
				
				var errorsEgpModel = that.C_MODEL.errorsEgp;
				var errorsEgpData = errorsEgpModel.getData();
				if(errorsEgpData.length > 0){
					
					var controlModel = that.C_MODEL.controlModel;
					controlModel.setProperty("/ERROR_NUM", errorsEgpData.length);
					controlModel.setProperty("/VISIBLE", true);
		
					that.oMessagePopoverEgp = new sap.m.MessagePopover({
						items: {
							path: '/',
							template: oMessageTemplate
						}
					});
						
					that.oMessagePopoverEgp.setModel(errorsEgpModel);
					oButton.addDependent(that.oMessagePopoverEgp);
					oButton.setVisible(true);
					
					setTimeout(function(){
						this.oMessagePopoverEgp.openBy(oButton);
					}.bind(that), 100);
					
				}else{
					
					var prEgpInfo = that.C_MODEL.prEgpInfo.getData();
					
					that.C_MODEL.prEgpData.setProperty("/BSART", prEgpInfo.BSART);
					that.C_MODEL.prEgpData.setProperty("/BSART_NAME", prEgpInfo.BSART_NAME);
					that.C_MODEL.prEgpData.setProperty("/WERKS", prEgpInfo.WERKS);
					that.C_MODEL.prEgpData.setProperty("/WERKS_NAME", prEgpInfo.WERKS_NAME);
					that.C_MODEL.prEgpData.setProperty("/EKGRP", prEgpInfo.EKGRP);
					that.C_MODEL.prEgpData.setProperty("/EKGRP_NAME", prEgpInfo.EKGRP_NAME);
					that.C_MODEL.prEgpData.setProperty("/EGP_YEAR", prEgpInfo.EGP_YEAR);		//CH12: INS
					that.C_MODEL.prEgpData.updateBindings();
					
					that.getOwnerComponent().getModel("prEgpData").setData(that.C_MODEL.prEgpData.getData());
					that.getOwnerComponent().getModel("prEgpData").updateBindings();
					return new Promise(function (fnResolve) {
						that.doNavigate("PrNewHeader", "", fnResolve, "", "", "");
					}.bind(that)).catch(function (err) {
						if (err !== undefined) {
							MessageBox.error(err.message);
						}
					});
					
				}
				
			});
			
		},
		
		getDocTypeEgpMapping: function () {
			var srvModel = this.getView().getModel();
			var defer = new $.Deferred();
			var path = "/EgpPrDoctSet";
			srvModel.read(path, {
				success: function (s) {
					defer.resolve(s.results);
				},
				error: function (e) {
					defer.resolve([]);
				}
			});
			return defer;
		},
		
		handleChangeEgp: function(oEvent){
			
			var that = this;
			var aDefer = [];
			var dialog = oEvent.getSource().getParent().getParent().getParent().getParent();
			var prEgpInfo = that.C_MODEL.prEgpInfo.getData();
			
			if(prEgpInfo.EGP_NO !== "" && prEgpInfo.EGP_YEAR !== ""){
				
				if(!dialog.getBusy()){
					dialog.setBusyIndicatorDelay(0);
					dialog.setBusy(true);
				}
				aDefer.push(that.callEgpService("EGPWS0016"));
				aDefer.push(that.getDocTypeEgpMapping());
				$.when.apply($, aDefer).then(function (status, docTypeList) {
					
					if(status !== "ERROR"){
						var prEgpData = that.C_MODEL.prEgpData.getData();
						for(var i=0;i<docTypeList.length;i++){
							if(prEgpData.EGPWS0016.projectdetail.field3 === docTypeList[i].EGP_PU_CODE){
								that.C_MODEL.prEgpInfo.setProperty("/BSART", docTypeList[i].PR_DOCTYPE);
								that.C_MODEL.prEgpInfo.setProperty("/BSART_NAME", docTypeList[i].PU_DESC);
								that.C_MODEL.prEgpInfo.updateBindings();
								break;
							}	
						}
					}
					
					if(dialog.getBusy()){
						dialog.setBusy(false);
					}
					
				});
				
			}
			
		},
		
		callEgpService: function(serviceNo){
			
			var that = this;
			var defer = new $.Deferred();
			var prEgpInfo = this.C_MODEL.prEgpInfo.getData();
			
			var request = {
				"ProjectDatas" : {
					"LoginDatas" : {
						"FIELD1" : that.getOwnerComponent().egp.username,
						"FIELD2" : that.getOwnerComponent().egp.password
					},
					"Request" : {
						"FIELD1" : prEgpInfo.EGP_NO,
						"FIELD2" : prEgpInfo.EGP_YEAR
					}
				}
			};
			
			request = JSON.stringify(request);
			var requestJson = JSON.parse(request);
			var requestXml = this.OBJtoXML(requestJson);

			jQuery.ajax({
				url: "/EgpInterface/rest/" + serviceNo,
				data: requestXml,
				cache: false,
				contentType: 'application/xml',
				processData: false,
				async: true,
				type: 'POST',
				beforeSend: function (xhr) {
					// xhr.setRequestHeader('Authorization', 'Bearer ' + that.getCookie("___C_SANSIRI_API_TOKEN"));
				},
				success: function (data) {

					// defer.resolve("SUCCESS");
					
					var result = that.xmlToJson(data,serviceNo);
					
					switch (serviceNo) {
						case "EGPWS0016":
							// if(result.projectdatas.responsecode.field1 === "000"){			//CH12: DEL
							if(result.projectdatas.responsecode.field1 === "000" || result.projectdatas.responsecode.field1 === "999"){	//CH12: INS
								that.C_MODEL.prEgpData.setProperty("/EGPWS0016", result.projectdatas);
								that.C_MODEL.prEgpData.updateBindings();
								// that.navtoCreatePage();
								defer.resolve("SUCCESS");
							}else{
								that.addErrorEgp(serviceNo, result.projectdatas.responsecode);
								defer.resolve("ERROR");
							}
							break;
						case "EGPWS0006":
							if(result.projectdatas.responsecode.field1 === "000"){
								that.C_MODEL.prEgpData.setProperty("/EGPWS0006", result.projectdatas);
								that.C_MODEL.prEgpData.updateBindings();
								// that.navtoCreatePage();
								defer.resolve("SUCCESS");
							}else{
								that.addErrorEgp(serviceNo, result.projectdatas.responsecode);
								defer.resolve("ERROR");
							}
							break;
						case "EGPWS0007":
							if(result.productdatas.responsecode.field1 === "000"){
								that.C_MODEL.prEgpData.setProperty("/EGPWS0007", result.productdatas);
								that.C_MODEL.prEgpData.updateBindings();
								// that.navtoCreatePage();
								defer.resolve("SUCCESS");
							}else{
								that.addErrorEgp(serviceNo, result.productdatas.responsecode);
								defer.resolve("ERROR");
							}
							break;
						default:
					}

				},
				error: function (error) {
					var responsecode = {
						"field1": "",
						"field2": "ไม่สามารถติตต่อกับ e-GP Service: " + serviceNo
					};
					that.addErrorEgp(serviceNo, responsecode);
					defer.resolve("ERROR");
				}
			});
			
			return defer;
			
			
		},
		
		addErrorEgp: function(serviceNo,responsecode){
			
			var errorsEgpModel = this.C_MODEL.errorsEgp;
			var errorsEgpData = errorsEgpModel.getData();
			var error = {
				type: "Error",
				groupName: "Service " + serviceNo,
				title: "Service " + serviceNo + ": " + responsecode.field2,
				description: responsecode.field1,
				subtitle: responsecode.field1
			};
			errorsEgpData.push(error);
			errorsEgpModel.updateBindings();
		},
		
		handleErrorLogEgpPress: function (evt) {
			this.oMessagePopoverEgp.openBy(evt.getSource());
		},
		
		onCloseDialogEgp: function(oEvent){
			this.C_MODEL.prEgpInfo.setData({});
			this.C_MODEL.prEgpInfo.updateBindings();
			this.C_MODEL.errorsEgp.setData({});
			this.C_MODEL.errorsEgp.updateBindings();
			this._oEgpDialog.close();
		},
		
		onVHDocumentTypeEgp: function (oEvent) {

			var that = this;
			var model = this.C_MODEL.prEgpInfo;
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
                    	// that.changeMessageModel(sTarget);
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
		
		onChangeDocumentTypeEgp: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prEgpInfo = that.C_MODEL.prEgpInfo;
			var docType = prEgpInfo.getProperty("/BSART");
			var sTarget = oEvent.getSource().getBindingPath("value");

			if (!docType) {
				prEgpInfo.setProperty("/BSART", "");
				prEgpInfo.setProperty("/BSART_NAME", "");
				return;
			}

			var path = "/F4PrTypeSet(BSTYP='B',BSART='" + docType + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prEgpInfo.setProperty("/BSART", s.BSART);
					prEgpInfo.setProperty("/BSART_NAME", s.BATXT);
					// that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					prEgpInfo.setProperty("/BSART", "");
					prEgpInfo.setProperty("/BSART_NAME", "");

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHPlantEgp: function (oEvent) {

			var that = this;
			var model = this.C_MODEL.prEgpInfo;
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
                    	model.updateBindings();
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
		
		onChangePlantEgp: function (oEvent) {

			//Get Material Name
			var that = this;
			var srvModel = that.getView().getModel();
			var prEgpInfo = that.C_MODEL.prEgpInfo;
			var plant = prEgpInfo.getProperty("/WERKS");
			var sTarget = oEvent.getSource().getBindingPath("value");
			
			if (!plant) {
				prEgpInfo.setProperty("/WERKS", "");
				prEgpInfo.setProperty("/WERKS_NAME", "");
				return;
			}

			var path = "/F4PlantSet('" + plant + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prEgpInfo.setProperty("/WERKS_NAME", s.NAME1);
					// that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					prEgpInfo.setProperty("/WERKS", "");
					prEgpInfo.setProperty("/WERKS_NAME", "");

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		onVHPurchasingGroupEgp: function (oEvent) {

			var that = this;
			var model = this.C_MODEL.prEgpInfo;
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
		
		onChangePurchasingGroupEgp: function (oEvent) {

			var that = this;
			var srvModel = that.getView().getModel();
			var prEgpInfo = that.C_MODEL.prEgpInfo;
			var purchasingGroup = prEgpInfo.getProperty("/EKGRP");
			var sTarget = oEvent.getSource().getBindingPath("value");
			
			if (!purchasingGroup) {
				prEgpInfo.setProperty("/EKGRP", "");
				prEgpInfo.setProperty("/EKGRP_NAME", "");
				return;
			}

			var path = "/F4PurGroupSet('" + purchasingGroup + "')";

			srvModel.read(path, {

				success: function (s) {
					
					prEgpInfo.setProperty("/EKGRP_NAME", s.EKNAM);
					// that.changeMessageModel(sTarget);

				},

				error: function (pError) {
					
					prEgpInfo.setProperty("/EKGRP", "");
					prEgpInfo.setProperty("/EKGRP_NAME", "");

					var msg = that.getView().getModel("i18n").getProperty("Message.NoDataFound");
					sap.m.MessageToast.show(msg, {
						duration: 2000
					});

				}

			});

		},
		
		OBJtoXML: function(obj) {
		  var xml = '';
		  for (var prop in obj) {
		    xml += obj[prop] instanceof Array ? '' : "<" + prop + ">";
		    if (obj[prop] instanceof Array) {
		      for (var array in obj[prop]) {
		        xml += "<" + prop + ">";
		        xml += this.OBJtoXML(new Object(obj[prop][array]));
		        xml += "</" + prop + ">";
		      }
		    } else if (typeof obj[prop] == "object") {
		      xml += this.OBJtoXML(new Object(obj[prop]));
		    } else {
		      xml += obj[prop];
		    }
		    xml += obj[prop] instanceof Array ? '' : "</" + prop + ">";
		  }
		  var xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
		  return xml;
		  
		},
		
		parsexml: function (node, j, serviceNo) {
			var that = this;
		    var nodeName = node.nodeName.replace(/^.+:/, '').toLowerCase();
		    var cur = null;
		    var text = $(node).contents().filter(function(x) {
		      return this.nodeType === 3;
		    });
		    if (text[0] && text[0].nodeValue.trim()) {
		      cur = text[0].nodeValue;
		    } else {
		      cur = {};
		      $.each(node.attributes, function() {
		        if (this.name.indexOf('xmlns:') !== 0) {
		          cur[this.name.replace(/^.+:/, '')] = this.value;
		        }
		      });
		      $.each(node.children, function() {
		        that.parsexml(this, cur, serviceNo);
		      });
		    }
		    
		    // j[nodeName] = cur;
		    
		    if(nodeName === "considerdetail" || nodeName === "considerdetails" || nodeName === "product"){
				if(!j[nodeName]){
					j[nodeName] = [];
				}	
				j[nodeName].push(cur);
			}else{
				j[nodeName] = cur;
			}
			
		  },
		
		xmlToJson: function (xml,serviceNo) {
		  var roots = $(xml);
		  var root = roots[roots.length-1];
		  var json = {};
		  this.parsexml(root, json, serviceNo);
		  return json['#document'];
		},
		
		onBeforeExport: function(oEvent){
			var that = this;
			var oExport = oEvent.mParameters.exportSettings;
			that._checkPropertyType(oExport);
		},
		
		_checkPropertyType: function(oValue) {
			// Be careful, There are Static variables for ONLY this file and Page1ProjectList.view.xml .
			var arr = oValue.workbook.columns;
			for( var i in arr) {
				switch(arr[i].property) {
					case "BADAT": 
						arr[i].type = sap.ui.export.EdmType.Date; 
						break;
				}
			}
		},
		
		// xmlToJson('<?xml version="1.0" encoding="UTF-8"?><atom:entry xmlns:atom="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata"> <atom:content type="application/xml"> <m:properties> <d:Pernr>800001</d:Pernr> <d:Approve>X</d:Approve> </m:properties> </atom:content> <atom:link rel="http://schemas.microsoft.com/ado/2007/08/dataservices/related/ToLeaveItem" type="application/atom+xml;type=feed" title="ZHR_APP_SRV.Header_Item"> <m:inline> <atom:feed> <atom:entry> <atom:content type="application/xml"> <m:properties> <d:Pernr></d:Pernr> <d:Index>0</d:Index> <d:RequestId>74867AF30B3A1ED4BDA9EDC88782C0EC</d:RequestId> </m:properties> </atom:content> </atom:entry> </atom:feed> </m:inline> </atom:link> </atom:entry>');
 
		
		onExit: function () {

			// to destroy templates for bound aggregations when templateShareable is true on exit to prevent duplicateId issue
			var aControls = [{
				"controlId": "Fiori_ListReport_ListReport_0-filterBars-Fiori_ListReport_FilterBar-1-filters-sap_ui_comp_filterbar_FilterItem-1553250678532-control-sap_m_ComboBox-1553250689620",
				"groups": ["items"]
			}, {
				"controlId": "Fiori_ListReport_ListReport_0-filterBars-Fiori_ListReport_FilterBar-1-filters-sap_ui_comp_filterbar_FilterItem-1553832170719-control-sap_m_ComboBox-1",
				"groups": ["items"]
			}, {
				"controlId": "Fiori_ListReport_ListReport_0-filterBars-Fiori_ListReport_FilterBar-1-filters-sap_ui_comp_filterbar_FilterItem-1553250441443-control-sap_m_ComboBox-1553250660929",
				"groups": ["items"]
			}, {
				"controlId": "Fiori_ListReport_ListReport_0-content-Fiori_ListReport_Table-1",
				"groups": ["items"]
			}];
			for (var i = 0; i < aControls.length; i++) {
				var oControl = this.getView().byId(aControls[i].controlId);
				if (oControl) {
					for (var j = 0; j < aControls[i].groups.length; j++) {
						var sAggregationName = aControls[i].groups[j];
						var oBindingInfo = oControl.getBindingInfo(sAggregationName);
						if (oBindingInfo) {
							var oTemplate = oBindingInfo.template;
							oTemplate.destroy();
						}
					}
				}
			}

		}
	});
}, /* bExport= */ true);