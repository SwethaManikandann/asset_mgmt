sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, Fragment, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("assetmgmt.ext.controller.ListReportExt", {

        onCreateSimLog: function (oEvent) {
            var oView = this.getView();

            if (!this._pCreateDialog) {
                this._pCreateDialog = Fragment.load({
                    id: oView.getId(),
                    name: "assetmgmt.ext.fragment.CreateDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pCreateDialog.then(function (oDialog) {
                // Reset model
                var oEntry = {
                    Bukrs: "",
                    Anln1: "",
                    Afabe: "",
                    UsefulLifeNew: 0,
                    ScrapValueNew: 0.00,
                    Comments: ""
                };
                var oJsonModel = new JSONModel(oEntry);
                oDialog.setModel(oJsonModel, "createModel");
                oDialog.open();
            });
        },

        onSaveSimLog: function () {
            var oDialog = this.getView().byId("createDialog");
            var oModel = oDialog.getModel("createModel");
            var oData = oModel.getData();

            // Validate mandatory fields
            if (!oData.Bukrs || !oData.Anln1 || !oData.Afabe) {
                MessageBox.error("Please fill all mandatory fields (Company Code, Asset, Dep. Area).");
                return;
            }

            // Prepare Payload
            var oPayload = {
                Bukrs: oData.Bukrs,
                Anln1: oData.Anln1,
                Afabe: oData.Afabe,
                UsefulLifeNew: parseInt(oData.UsefulLifeNew, 10),
                ScrapValueNew: parseFloat(oData.ScrapValueNew).toFixed(2),
                Comments: oData.Comments,
                // Auto-filled
                SimDate: new Date(),
                SimTime: {
                    ms: new Date().getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
                    __edmType: "Edm.Time"
                }, // OData V2 Time format approximation or use string if backend expects string
                SimUser: "User" // Placeholder
            };

            // Adjust SimTime if strictly Edm.Time:
            // Often V2 Model handles Date objects for Time if type is specified in valid metadata. 
            // Since we don't have real metadata, we must hope standard binding works.
            // Safe bet: Let ODataModel handle Date for DateTime. For Time, it's tricky without metadata.
            // I'll try passing a helper object or just the formatted string if needed.

            // Get Main OData Model
            var oODataModel = this.getView().getModel();

            oODataModel.create("/Sim_LogSet", oPayload, {
                success: function () {
                    MessageToast.show("Simulation Log Created Successfully");
                    oDialog.close();
                    this.extensionAPI.refreshTable(); // Fiori Elements API to refresh
                }.bind(this),
                error: function (oError) {
                    var sMsg = "Error creating log.";
                    try {
                        var oBody = JSON.parse(oError.responseText);
                        sMsg = oBody.error.message.value;
                    } catch (e) {
                        // fallback
                    }
                    MessageBox.error(sMsg);
                }
            });
        },

        onRefreshTable: function () {
            this.extensionAPI.refreshTable();
            MessageToast.show("Table Refreshed");
        },

        onCancelSimLog: function () {
            this.getView().byId("createDialog").close();
        }
    });
});
