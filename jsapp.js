var selectedVendeur = null;
var selectedAcheteur = null;
var contactAcheteur = null;
var contactVendeur = null;

ZOHO.embeddedApp.on("PageLoad", function(data) {
    loadVendeurs();
});

ZOHO.embeddedApp.init().then(function() {
    loadVendeurs();
});

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function loadVendeurs() {
    showLoading(true);
    ZOHO.CRM.API.getAllRecords({
        Entity: "Vendeurs",
        sort_order: "asc",
        per_page: 100
    }).then(function(data) {
        showLoading(false);
        const select = document.getElementById('vendeurSelect');
        select.innerHTML = '<option value="">-- Choisir un vendeur --</option>';
        
        if (data.data && data.data.length > 0) {
            data.data.forEach(function(vendeur) {
                const option = document.createElement('option');
                option.value = vendeur.id;
                const displayText = `${vendeur.Name} (${vendeur.Nom || 'Sans contact'} - ${vendeur.Secteur_Activite || 'Secteur N/A'})`;
                option.textContent = displayText;
                select.appendChild(option);
            });
        }
        
        select.onchange = function() {
            selectVendeur(this.value);
        };
    }).catch(function(error) {
        showLoading(false);
        console.error("Erreur chargement vendeurs:", error);
    });
}

function selectVendeur(vendeurId) {
    if (!vendeurId) {
        document.getElementById('nextStep1').disabled = true;
        document.getElementById('vendeurInfo').style.display = 'none';
        selectedVendeur = null;
        return;
    }

    showLoading(true);
    ZOHO.CRM.API.getRecord({
        Entity: "Vendeurs",
        RecordID: vendeurId
    }).then(function(data) {
        selectedVendeur = data.data[0];
        
        if (selectedVendeur.Nom && selectedVendeur.Nom.id) {
            return ZOHO.CRM.API.getRecord({
                Entity: "Contacts",
                RecordID: selectedVendeur.Nom.id
            });
        } else {
            return Promise.resolve(null);
        }
    }).then(function(contactData) {
        showLoading(false);
        
        if (contactData && contactData.data) {
            contactVendeur = contactData.data[0];
        }
        
        document.getElementById('vendeurDetails').innerHTML = `
            <p><strong>ID:</strong> ${selectedVendeur.Name}</p>
            <p><strong>Contact:</strong> ${selectedVendeur.Nom ? selectedVendeur.Nom.name : 'Aucun'}</p>
            <p><strong>Secteur:</strong> ${selectedVendeur.Secteur_Activite || 'Non spécifié'}</p>
        `;
        
        document.getElementById('vendeurInfo').style.display = 'block';
        document.getElementById('nextStep1').disabled = false;
    }).catch(function(error) {
        showLoading(false);
        console.error("Erreur vendeur:", error);
    });
}

function showStep1() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('result').style.display = 'none';
}

function showStep2() {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    loadAcheteurs();
}

function loadAcheteurs() {
    showLoading(true);
    ZOHO.CRM.API.getAllRecords({
        Entity: "Acheteurs",
        sort_order: "asc",
        per_page: 100
    }).then(function(data) {
        showLoading(false);
        const select = document.getElementById('acheteurSelect');
        select.innerHTML = '<option value="">-- Choisir un acheteur --</option>';
        
        if (data.data && data.data.length > 0) {
            data.data.forEach(function(acheteur) {
                const option = document.createElement('option');
                option.value = acheteur.id;
                const displayText = `${acheteur.Name} (${acheteur.Nom ? acheteur.Nom.name : 'Sans contact'})`;
                option.textContent = displayText;
                select.appendChild(option);
            });
        }
        
        select.onchange = function() {
            selectAcheteur(this.value);
        };
    }).catch(function(error) {
        showLoading(false);
        console.error("Erreur acheteurs:", error);
    });
}

function selectAcheteur(acheteurId) {
    if (!acheteurId) {
        document.getElementById('createMatch').disabled = true;
        document.getElementById('acheteurInfo').style.display = 'none';
        selectedAcheteur = null;
        return;
    }

    showLoading(true);
    ZOHO.CRM.API.getRecord({
        Entity: "Acheteurs",
        RecordID: acheteurId
    }).then(function(data) {
        selectedAcheteur = data.data[0];
        
        if (selectedAcheteur.Nom && selectedAcheteur.Nom.id) {
            return ZOHO.CRM.API.getRecord({
                Entity: "Contacts",
                RecordID: selectedAcheteur.Nom.id
            });
        } else {
            return Promise.resolve(null);
        }
    }).then(function(contactData) {
        showLoading(false);
        
        if (contactData && contactData.data) {
            contactAcheteur = contactData.data[0];
        }
        
        document.getElementById('acheteurDetails').innerHTML = `
            <p><strong>ID:</strong> ${selectedAcheteur.Name}</p>
            <p><strong>Contact:</strong> ${selectedAcheteur.Nom ? selectedAcheteur.Nom.name : 'Aucun'}</p>
            <p><strong>Email:</strong> ${contactAcheteur && contactAcheteur.Email ? contactAcheteur.Email : 'Non disponible'}</p>
        `;
        
        document.getElementById('acheteurInfo').style.display = 'block';
        document.getElementById('createMatch').disabled = false;
    }).catch(function(error) {
        showLoading(false);
        console.error("Erreur acheteur:", error);
    });
}

function createMatch() {
    if (!selectedVendeur || !selectedAcheteur) {
        alert("Veuillez sélectionner un vendeur et un acheteur");
        return;
    }
    
    showLoading(true);
    
    var matchData = {
        "Secteur_Activite": selectedVendeur.Secteur_Activite || "",
        "Vendeur": selectedVendeur.Name,
        "Acheteur": selectedAcheteur.Name,
        "Email": contactAcheteur && contactAcheteur.Email ? contactAcheteur.Email : ""
    };
    
    if (selectedAcheteur.Nom && selectedAcheteur.Nom.id) {
        matchData["Contact_Acheteur"] = selectedAcheteur.Nom.id;
    }
    if (selectedVendeur.Nom && selectedVendeur.Nom.id) {
        matchData["Contact_Vendeur"] = selectedVendeur.Nom.id;
    }

    ZOHO.CRM.API.insertRecord({
        Entity: "Matches",
        APIData: matchData,
        Trigger: ["approval", "workflow", "blueprint"]
    }).then(function(data) {
        showLoading(false);
        
        if (data.data && data.data[0] && data.data[0].details && data.data[0].details.id) {
            const matchId = data.data[0].details.id;
            
            document.getElementById('resultContent').innerHTML = `
                <h5>🎯 Match créé - ID: ${matchId}</h5>
                <p><strong>Vendeur:</strong> ${selectedVendeur.Name}</p>
                <p><strong>Acheteur:</strong> ${selectedAcheteur.Name}</p>
                <p><strong>Secteur:</strong> ${selectedVendeur.Secteur_Activite || 'Non spécifié'}</p>
            `;
            
            document.getElementById('step2').style.display = 'none';
            document.getElementById('result').style.display = 'block';
        }
    }).catch(function(error) {
        showLoading(false);
        console.error("Erreur création:", error);
        alert("Erreur lors de la création du match");
    });
}

function resetForm() {
    selectedVendeur = null;
    selectedAcheteur = null;
    contactAcheteur = null;
    contactVendeur = null;
    
    document.getElementById('vendeurSelect').value = '';
    document.getElementById('acheteurSelect').value = '';
    document.getElementById('vendeurInfo').style.display = 'none';
    document.getElementById('acheteurInfo').style.display = 'none';
    document.getElementById('nextStep1').disabled = true;
    document.getElementById('createMatch').disabled = true;
    
    showStep1();
}