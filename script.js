document.addEventListener('DOMContentLoaded', () => {
    console.log("Biodata Script Loaded v2");
    const form = document.getElementById('biodataForm');
    const photoInput = document.getElementById('photoUpload');
    const photoInput2 = document.getElementById('photoUpload2');
    const displayPhoto = document.getElementById('displayPhoto');
    const displayPhoto2 = document.getElementById('displayPhoto2');
    const printBtn = document.getElementById('printBtn');

    // Function to update preview
    function updatePreview() {
        const formData = new FormData(form);

        // Loop through all data-bind elements
        document.querySelectorAll('[data-bind]').forEach(el => {
            const fieldName = el.getAttribute('data-bind');
            const value = formData.get(fieldName);

            // Format dates slightly nicer if it's a date field
            if (fieldName === 'dob' && value) {
                const dateObj = new Date(value);
                const formatted = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
                el.textContent = formatted;
            } else {
                el.textContent = value || '';
            }
        });
    }

    // Event listeners for all inputs (Delegation)
    form.addEventListener('input', updatePreview);

    // Photo Upload Handler 1
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                displayPhoto.src = e.target.result;
                saveToLocalStorage(); // Save immediately
            };
            reader.readAsDataURL(file);
        }
    });

    // Photo Upload Handler 2
    if (photoInput2) {
        photoInput2.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    displayPhoto2.src = e.target.result;
                    saveToLocalStorage(); // Save immediately
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Print Handler
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Save Data Handler
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Add current photo src to data if it's not the placeholder
            if (displayPhoto.src && !displayPhoto.src.includes('placeholder')) {
                data._photoData = displayPhoto.src;
            }
            if (displayPhoto2.src && !displayPhoto2.src.includes('placeholder')) {
                data._photoData2 = displayPhoto2.src;
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'biodata-data.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Load Data Handler
    const loadBtn = document.getElementById('loadBtn');
    const jsonInput = document.getElementById('jsonInput');

    if (loadBtn && jsonInput) {
        loadBtn.addEventListener('click', () => {
            jsonInput.click();
        });

        jsonInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Identify and create custom fields if they don't exist
                    Object.keys(data).forEach(key => {
                        if (key !== '_photoData' && key !== '_photoData2' && !form.querySelector(`[name="${key}"]`)) {
                            // Default to 'personal' if unknown
                            addCustomField('personal', key, key.replace(/_/g, ' '));
                        }
                    });

                    // Populate inputs
                    Object.keys(data).forEach(key => {
                        if (key === '_photoData') {
                            displayPhoto.src = data[key];
                        } else if (key === '_photoData2') {
                            displayPhoto2.src = data[key];
                        } else {
                            const input = form.querySelector(`[name="${key}"]`);
                            if (input) input.value = data[key];
                        }
                    });

                    updatePreview();
                    saveToLocalStorage();
                    alert('Data loaded successfully!');
                } catch (err) {
                    console.error(err);
                    alert('Error parsing JSON file.');
                }
            };
            reader.readAsText(file);
        });
    }

    // Add Custom Field Handler
    const addBtns = document.querySelectorAll('.add-field-btn');
    console.log("Found add buttons:", addBtns.length);

    addBtns.forEach(btn => {
        btn.onclick = () => { // Using onclick to be sure
            console.log("Add button clicked");
            const sectionName = btn.getAttribute('data-section');
            const label = prompt("Enter the name of the new field (e.g. 'Hobbies'):");

            if (label) {
                const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');

                if (form.querySelector(`[name="${key}"]`)) {
                    alert('Field already exists!');
                    return;
                }

                addCustomField(sectionName, key, label);
            }
        };
    });

    function addCustomField(section, key, label) {
        // 1. Add Input to Form
        const inputContainer = document.getElementById(`${section}-inputs`);
        if (!inputContainer) {
            console.error(`Container ${section}-inputs not found!`);
            return;
        }

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label>${label}</label>
            <input type="text" name="${key}" placeholder="">
        `;
        inputContainer.appendChild(formGroup);

        // 2. Add Row to Preview
        const previewContainer = document.getElementById(`${section}-preview`);
        if (!previewContainer) {
            console.error(`Preview container ${section}-preview not found!`);
            return;
        }

        const previewRow = document.createElement('div');
        previewRow.className = 'row';
        previewRow.innerHTML = `
            <span class="label">${label}</span> 
            <span class="sep">:</span> 
            <span class="value" data-bind="${key}"></span>
        `;
        previewContainer.appendChild(previewRow);

        // Add controls to the new field
        addFieldControls(formGroup, key);
    }

    // Function to add Rename/Delete/Move controls to a form group
    function addFieldControls(formGroup, key) {
        // Check if already added
        if (formGroup.querySelector('.field-controls')) return;

        const controls = document.createElement('div');
        controls.className = 'field-controls';

        // Move Up Button
        const upBtn = document.createElement('button');
        upBtn.className = 'control-btn move-btn';
        upBtn.innerHTML = '▲';
        upBtn.title = 'Move Up';
        upBtn.type = 'button';
        upBtn.onclick = (e) => {
            e.stopPropagation();
            moveField(formGroup, key, 'up');
        };

        // Move Down Button
        const downBtn = document.createElement('button');
        downBtn.className = 'control-btn move-btn';
        downBtn.innerHTML = '▼';
        downBtn.title = 'Move Down';
        downBtn.type = 'button';
        downBtn.onclick = (e) => {
            e.stopPropagation();
            moveField(formGroup, key, 'down');
        };

        // Rename Button
        const renameBtn = document.createElement('button');
        renameBtn.type = 'button';
        renameBtn.className = 'control-btn rename-btn';
        renameBtn.innerHTML = '✎';
        renameBtn.title = 'Rename Field';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            const currentLabel = formGroup.querySelector('label').innerText;
            const newLabel = prompt("Enter new label:", currentLabel);
            if (newLabel && newLabel !== currentLabel) {
                // Update Form Label
                formGroup.querySelector('label').innerText = newLabel;

                // Update Preview Label
                const previewVal = document.querySelector(`[data-bind="${key}"]`);
                if (previewVal) {
                    const row = previewVal.closest('.row');
                    if (row) {
                        const labelSpan = row.querySelector('.label');
                        if (labelSpan) labelSpan.innerText = newLabel;
                    }
                }
                saveToLocalStorage(); // Save after rename
            }
        };

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'control-btn delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete Field';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this field?")) {
                // Remove Form Group
                formGroup.remove();

                // Remove Preview Row
                const previewVal = document.querySelector(`[data-bind="${key}"]`);
                if (previewVal) {
                    const row = previewVal.closest('.row');
                    if (row) row.remove();
                }
                saveToLocalStorage(); // Save after delete
            }
        };

        controls.appendChild(upBtn);
        controls.appendChild(downBtn);
        controls.appendChild(renameBtn);
        controls.appendChild(deleteBtn);
        formGroup.appendChild(controls);
    }

    function moveField(formGroup, key, direction) {
        const parent = formGroup.parentNode;
        const sibling = direction === 'up' ? formGroup.previousElementSibling : formGroup.nextElementSibling;

        if (sibling && sibling.classList.contains('form-group')) {
            // Move Form Group
            if (direction === 'up') {
                parent.insertBefore(formGroup, sibling);
            } else {
                parent.insertBefore(formGroup, sibling.nextElementSibling); // Insert after sibling
            }

            // Move Preview Row
            const previewVal = document.querySelector(`[data-bind="${key}"]`);
            if (previewVal) {
                const row = previewVal.closest('.row');
                const rowParent = row.parentNode;

                // Find the sibling form group's key to find its corresponding preview row
                const siblingInput = sibling.querySelector('input, select, textarea');
                if (siblingInput && siblingInput.name) {
                    const siblingKey = siblingInput.name;
                    const siblingPreviewVal = document.querySelector(`[data-bind="${siblingKey}"]`);
                    if (siblingPreviewVal) {
                        const siblingRow = siblingPreviewVal.closest('.row');
                        if (siblingRow) {
                            if (direction === 'up') {
                                rowParent.insertBefore(row, siblingRow);
                            } else {
                                rowParent.insertBefore(row, siblingRow.nextElementSibling);
                            }
                        }
                    }
                }
            }
            saveToLocalStorage();
        }
    }

    // --- Persistence Logic ---
    function saveToLocalStorage() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        if (displayPhoto.src && !displayPhoto.src.includes('placeholder')) {
            data._photoData = displayPhoto.src;
        }
        if (displayPhoto2.src && !displayPhoto2.src.includes('placeholder')) {
            data._photoData2 = displayPhoto2.src;
        }

        // To preserve order of custom fields, we need to store the order of keys for each section.
        // For this implementation, we'll store the data values and let the load logic re-create fields
        // and then populate them. The order of custom fields will be determined by their creation order
        // during load, which might not be the exact order they were in when saved if new fields were added
        // between saves. A more robust solution would involve storing an array of field keys per section.
        localStorage.setItem('biodataState', JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const stored = localStorage.getItem('biodataState');
        if (!stored) return;

        try {
            const data = JSON.parse(stored);

            // Re-create custom fields if needed.
            // This needs to happen before populating values.
            // We iterate over the stored data keys to identify custom fields.
            // Note: This re-creates them in the order they appear in the JSON,
            // not necessarily their original visual order if they were moved.
            Object.keys(data).forEach(key => {
                // Check if it's not the photo data and if an input with this name doesn't already exist
                if (key !== '_photoData' && key !== '_photoData2' && !form.querySelector(`[name="${key}"]`)) {
                    // We assume 'personal' section for dynamically loaded custom fields if section info isn't stored.
                    // A more advanced solution would store section information with the field.
                    addCustomField('personal', key, key.replace(/_/g, ' '));
                }
            });

            // Populate
            Object.keys(data).forEach(key => {
                if (key === '_photoData') {
                    displayPhoto.src = data[key];
                } else if (key === '_photoData2') {
                    displayPhoto2.src = data[key];
                } else {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) input.value = data[key];
                }
            });
            updatePreview();
        } catch (e) {
            console.error("Error loading state from local storage", e);
            // Optionally clear corrupted data
            localStorage.removeItem('biodataState');
        }
    }

    // Initialize controls for ALL existing static fields
    document.querySelectorAll('.form-group').forEach(group => {
        const input = group.querySelector('input, select, textarea');
        // Exclude photoUpload as it's not a standard text input and doesn't need these controls
        if (input && input.name && input.id !== 'photoUpload') {
            addFieldControls(group, input.name);
        }
    });

    // Hook up auto-save
    form.addEventListener('input', () => {
        updatePreview();
        saveToLocalStorage();
    });

    // Hook up photo save when it loads (e.g., after upload or initial load)
    displayPhoto.addEventListener('load', () => {
        saveToLocalStorage();
    });
    // Add check for displayPhoto2 before adding listener to avoid errors if element missing
    if (displayPhoto2) {
        displayPhoto2.addEventListener('load', () => {
            saveToLocalStorage();
        });
    }

    // Word Export Handler
    const wordBtn = document.getElementById('wordBtn');
    if (wordBtn) {
        wordBtn.addEventListener('click', () => {
            // Get the HTML content of the preview
            const preview = document.getElementById('biodataPreview');

            // Get styles
            let css = '';
            for (let i = 0; i < document.styleSheets.length; i++) {
                try {
                    const sheet = document.styleSheets[i];
                    // Only include our own style.css or inline styles, skip external web fonts to avoid CORS issues if possible
                    if (sheet.href && sheet.href.includes('style.css')) {
                        const rules = sheet.cssRules || sheet.rules;
                        for (let j = 0; j < rules.length; j++) {
                            css += rules[j].cssText + '\n';
                        }
                    }
                } catch (e) {
                    console.warn('Could not read stylesheet', e);
                }
            }

            // Add specific print/word overrides
            css += `
                body { background: white; }
                .biodata-paper { border: none; box-shadow: none; margin: 0 auto; width: 100%; max-width: 700px; }
             `;

            const htmlContent = `
                 <!DOCTYPE html>
                 <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                 <head>
                     <meta charset="utf-8">
                     <title>Biodata</title>
                     <style>
                         ${css}
                     </style>
                 </head>
                 <body>
                     ${preview.outerHTML}
                 </body>
                 </html>
             `;

            const blob = new Blob(['\ufeff', htmlContent], {
                type: 'application/msword'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Biodata.doc'; // .doc works better for HTML content than .docx
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    // Load on startup
    loadFromLocalStorage();

    // Initial update (after loading data)
    updatePreview();
});
