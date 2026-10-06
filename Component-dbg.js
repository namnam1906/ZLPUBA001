/*
* ------------------------------------------------------------------------------------------------------------------
* CHANGED LOG
* ------------------------------------------------------------------------------------------------------------------
* TR no.		| CHANGE-ID	| DATE		    | OWNER	    | DESCRIPTION
* ------------------------------------------------------------------------------------------------------------------
*  FEDK901477	| CH01	| 23/01/2020	| Sirirat S.	| Fix Onchange ItemCategory
*  FEDK901479	| CH02	| 28/01/2020	| Rawoot P.		| - Fix issue default material list for e-GP
*														| - Add pop-up navigatation to app committee by doc. type
*  FEDK901483	| CH03	| 30/01/2020	| Sirirat S.	| Fix Onchange ItemCategory in PRItem		
*  FEDK901563	| CH04	| 20/03/2020	| Sirirat S.	| Fix set limitsize of pritem table		
*  FEDK901581	| CH04-2| 25/03/2020	| Sirirat S.	| Fix set limitsize of pritem table	in copy	
*  FEDK901599	| CH04-3| 27/03/2020	| Sirirat S.	| Fix set limitsize of pritem table	in Add and copyitem	
*  FEDK901636	| CH05  | 13/04/2020	| Sirirat S.	| Fix set default date
*  FEDK901707	| CH06  | 28/05/2020	| Sirirat S.	| Fix case copy item pr and add pr
*  FEDK901707	| CH07  | 29/10/2020	| Chutchon W.	| Fix case add or del item pr 
*  FEDK901919	| CH08  | 15/12/2020	| Sirirat S.	| Fix case no project egp create ref EGP
*  FEDK902095	| CH09  | 15/12/2021	| Sirirat S.	| Fix case check doctype for nosign
*  FEDK902844   | CH10  | 09/06/2022    | NATTAPHON K.  | Manage PR case error to warning exeed
*  FEDK902908   | CH11  | 03/08/2022    | Suraphan P.   | Fix Not Show Close Button when PRItem EQ '1INT'
*  FEDK903130   | CH12  | 14/09/2023    | Jarinya V.    | Skip Warning Response Code '999' for Service16 (EGPWS0016)
*  FEDK903167   | CH13  | 03/04/2024    | Tunpsith V.   | Add e-GP connection time check
*  FEDK903181   | CH14  | 25/06/2024    | Jarinya V.    | Fix cannot find asset
*  FEDK903232   | CH15  | 24/12/2024    | Tunpsith V.   | Change e-GP item text from 0007-field11 to 0006-field2  
*  FEDK903385   | CH16  | 09/09/2025    | Tunpsith V.   | Add EGP check exclusion for BSART 1A31, 1INT    
*               | CH17  | 20/05/2026    | Setthakorn B. | Add attach file error message
* ------------------------------------------------------------------------------------------------------------------
*/

sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/cu/s4hana/zlpuba001/model/models",
	"./model/errorHandling"
], function (UIComponent, Device, models, errorHandling) {
	"use strict";

	var navigationWithContext = {
		"PrHeaderSet": {
			"PrHeaderEdit": "",
			"PrItemEdit": "ToPrItem",
			"SaveSuccessDialog": "",
			"Dialog2": ""
		},
		"PrItemSet": {
			"PrItemEdit": ""
		},
		"MaterialGroupSet": {
			"AddItemToCart": "",
			"DialogCart": "ToMaterial"
		},
		"MaterialSet": {
			"DialogCart": ""
		}
	};
	
	return UIComponent.extend("com.cu.s4hana.zlpuba001.Component", {

		metadata: {
			manifest: "json",
		config: {
				fullWidth: true
			}
		},
		
		egp: {
			username: "CUERP_EGP",
			password: "Rmk5dWRdaDtwc3YsMTk="
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

			// set the dataSource model
			this.setModel(new sap.ui.model.json.JSONModel({
				"uri": "/here/goes/your/serviceUrl/local/"
			}), "dataSource");

			// set application model
			var oApplicationModel = new sap.ui.model.json.JSONModel({});
			this.setModel(oApplicationModel, "applicationModel");

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// delegate error handling
			// errorHandling.register(this);

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		createContent: function () {
			var app = new sap.m.App({
				id: "zlpuba001"
			});
			var appType = "App";
			var appBackgroundColor = "";
			if (appType === "App" && appBackgroundColor) {
				app.setBackgroundColor(appBackgroundColor);
			}

			return app;
		},

		getNavigationPropertyForNavigationWithContext: function (sEntityNameSet, targetPageName) {
			var entityNavigations = navigationWithContext[sEntityNameSet];
			return entityNavigations == null ? null : entityNavigations[targetPageName];
		}

	});

});