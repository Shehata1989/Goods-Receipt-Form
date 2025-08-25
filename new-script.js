// Main Receipt Form Application
const ReceiptForm = (function () {
  // DOM Elements
  let itemsList, addItemBtn, receiptForm;
  let itemCounter = 1;

  // Initialize the application
  function init() {
    // Get DOM elements
    itemsList = document.getElementById("itemsList");
    addItemBtn = document.getElementById("addItemBtn");
    receiptForm = document.getElementById("receiptForm");
    const saveBtn = document.getElementById("saveForm");
    const resetBtn = document.getElementById("resetForm");
    const printBtn = document.getElementById("printForm");

    // Add header row and first item
    addHeaderRow();
    addItemRow();

    // Setup event listeners
    if (addItemBtn) addItemBtn.addEventListener("click", addItemRow);
    if (saveBtn) saveBtn.addEventListener("click", handleFormSubmit);
    if (resetBtn) resetBtn.addEventListener("click", handleFormReset);
    if (printBtn) {
      // Remove any existing click handlers to prevent duplicates
      const newPrintBtn = printBtn.cloneNode(true);
      printBtn.parentNode.replaceChild(newPrintBtn, printBtn);
      
      let printInProgress = false;
      
      newPrintBtn.addEventListener("click", function printHandler(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        if (printInProgress) return;
        printInProgress = true;
        
        // Remove the click handler temporarily
        newPrintBtn.removeEventListener("click", printHandler);
        
        // Set a timeout to re-enable printing after a delay
        const reenablePrint = () => {
          printInProgress = false;
          newPrintBtn.addEventListener("click", printHandler);
        };
        
        // Re-enable after 3 seconds if the print dialog is cancelled
        const timeoutId = setTimeout(reenablePrint, 3000);
        
        // Handle after print completes
        const afterPrint = () => {
          clearTimeout(timeoutId);
          reenablePrint();
          window.removeEventListener('afterprint', afterPrint);
        };
        
        window.addEventListener('afterprint', afterPrint, { once: true });
        
        // Trigger print
        setTimeout(() => {
          try {
            window.print();
          } catch (err) {
            console.error('Print error:', err);
            reenablePrint();
          }
        }, 100);
      });
    }
    if (receiptForm) receiptForm.addEventListener("submit", handleFormSubmit);

    // Setup event delegation for remove buttons
    if (itemsList) {
      itemsList.addEventListener("click", function (e) {
        const removeBtn = e.target.closest(".remove-item");
        if (removeBtn) {
          e.preventDefault();
          const itemRow = removeBtn.closest(".item-row");
          if (itemRow && !itemRow.classList.contains("header-row")) {
            // Remove from localStorage
            const itemId = itemRow.dataset.itemId;
            if (itemId) {
              const savedData = JSON.parse(
                localStorage.getItem("receiptFormData") || "{}"
              );
              if (savedData.items && savedData.items[itemId]) {
                delete savedData.items[itemId];
                localStorage.setItem(
                  "receiptFormData",
                  JSON.stringify(savedData)
                );
              }
            }
            // Remove from DOM
            itemRow.remove();
          }
        }
      });
    }

    // Load saved data if exists
    loadFormData();
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Handle remove item clicks using event delegation
    if (itemsList) {
      itemsList.addEventListener("click", function (e) {
        if (e.target.closest(".remove-item")) {
          removeItemRow(e.target.closest(".remove-item"));
        }
      });
    }
  }

  // Add header row with labels
  function addHeaderRow() {
    if (!itemsList) return;

    // Clear existing items
    itemsList.innerHTML = "";

    // Add header row
    const headerRow = document.createElement("div");
    headerRow.className = "item-row header-row";
    headerRow.innerHTML = `
      <div class="item-field" data-label="وصف المنتج">
        <div class="field-label">وصف المنتج</div>
      </div>
      <div class="item-field" data-label="الكمية">
        <div class="field-label">الكمية</div>
      </div>
      <div class="item-field" data-label="الحالة">
        <div class="field-label">الحالة</div>
      </div>
      <div class="item-field" data-label="ملاحظات">
        <div class="field-label">ملاحظات</div>
      </div>
      <div class="item-actions" data-label="إجراءات">
        <div class="field-label">إجراءات</div>
      </div>
    `;
    itemsList.appendChild(headerRow);
  }

  // Add a new item row
  function addItemRow() {
    if (!itemsList) return;

    const itemId = itemCounter++;
    const itemRow = document.createElement("div");
    itemRow.className = "item-row";
    itemRow.dataset.itemId = itemId;

    itemRow.innerHTML = `
      <div class="item-field" data-label="وصف المنتج">
        <input
          type="text"
          id="item-desc-${itemId}"
          class="form-control"
          name="items[${itemId}][description]"
          required
          placeholder="أدخل وصف المنتج"
        />
      </div>
      <div class="item-field" data-label="الكمية">
        <input
          type="number"
          id="item-qty-${itemId}"
          class="form-control"
          name="items[${itemId}][quantity]"
          min="1"
          value="1"
          required
        />
      </div>
      <div class="item-field" data-label="الحالة">
        <select
          id="item-condition-${itemId}"
          class="form-control"
          name="items[${itemId}][condition]"
          required
        >
          <option value="جديدة">جديدة</option>
          <option value="مستعملة">مستعملة</option>
          <option value="تالفة">تالفة</option>
          <option value="ناقصة">ناقصة</option>
        </select>
      </div>
      <div class="item-field" data-label="ملاحظات">
        <input
          type="text"
          id="item-notes-${itemId}"
          class="form-control"
          name="items[${itemId}][notes]"
          placeholder="ملاحظات إضافية"
        />
      </div>
      <div class="item-actions" data-label="إجراءات">
        <button
          type="button"
          class="btn btn-sm btn-danger remove-item"
          title="حذف"
          aria-label="حذف المنتج"
          data-item-id="${itemId}"
        >
          <i class="fas fa-trash"></i> حذف
        </button>
      </div>
    `;

    itemsList.appendChild(itemRow);

    // Focus on the description input of the newly added row
    const descInput = document.getElementById(`item-desc-${itemId}`);
    if (descInput) {
      descInput.focus();
    }

    return itemRow;
  }

  // Remove an item row
  function removeItemRow(button) {
    const row = button.closest(".item-row");
    if (row && !row.classList.contains("header-row")) {
      const allRows = document.querySelectorAll(".item-row:not(.header-row)");
      if (allRows.length > 1) {
        row.remove();
      } else {
        // If it's the last row, just clear the inputs
        const inputs = row.querySelectorAll("input, select");
        inputs.forEach((input) => {
          if (input.type !== "button" && input.type !== "submit") {
            input.value = "";
            if (input.type === "select-one") input.selectedIndex = 0;
          }
        });
      }
    }
  }

  // Handle form submission
  function handleFormSubmit(e) {
    if (e) e.preventDefault();

    // Force validation
    if (receiptForm) {
      if (!receiptForm.checkValidity()) {
        receiptForm.classList.add("was-validated");
        const firstInvalid = receiptForm.querySelector(":invalid");
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
          firstInvalid.focus();
        }
        return false;
      }
    }

    const data = {
      items: [],
    };

    // Get all items
    document.querySelectorAll(".item-row:not(.header-row)").forEach((row) => {
      const desc = row.querySelector('[name$="[description]"]')?.value;
      if (desc) {
        // Only add if there's a description
        data.items.push({
          description: desc,
          quantity: row.querySelector('[name$="[quantity]"]')?.value || "1",
          condition:
            row.querySelector('[name$="[condition]"]')?.value || "جديدة",
          notes: row.querySelector('[name$="[notes]"]')?.value || "",
        });
      }
    });

    // Save to localStorage
    try {
      localStorage.setItem("formData", JSON.stringify(data));
      alert("تم حفظ النموذج بنجاح!");
    } catch (error) {
      console.error("Error saving form data:", error);
      alert("حدث خطأ أثناء حفظ النموذج. يرجى المحاولة مرة أخرى.");
    }

    return false;
  }

  // Handle form reset
  function handleFormReset() {
    if (
      confirm("هل أنت متأكد من إعادة تعيين النموذج؟ سيتم حذف جميع البيانات.")
    ) {
      receiptForm.reset();
      itemCounter = 1;
      addHeaderRow();
      addItemRow();
      localStorage.removeItem("formData");
    }
  }

  // Load saved form data
  function loadFormData() {
    try {
      const savedData = localStorage.getItem("formData");
      if (!savedData) return;

      const data = JSON.parse(savedData);
      console.log("Loading saved data:", data);

      // Restore items
      if (data.items && data.items.length > 0) {
        // Clear existing items
        addHeaderRow();
        itemCounter = 0; // Reset counter

        // Add items
        data.items.forEach((item, index) => {
          // Add new row for each item
          const row = addItemRow();
          if (row) {
            // Set values for the newly added row
            const rowIndex = itemCounter - 1;
            setValue(`items[${rowIndex}][description]`, item.description || "");
            setValue(`items[${rowIndex}][quantity]`, item.quantity || "1");
            setValue(
              `items[${rowIndex}][condition]`,
              item.condition || "جديدة"
            );
            setValue(`items[${rowIndex}][notes]`, item.notes || "");
          }
        });
      }

      // Restore signatures
      if (data.signatures) {
        const recSig = document.querySelector('[placeholder="توقيع المستلم"]');
        const supSig = document.querySelector('[placeholder="توقيع المورد"]');
        const recDate = document.getElementById("recipient-date");
        const supDate = document.getElementById("supplier-date");

        if (recSig && data.signatures.recipient) {
          recSig.value = data.signatures.recipient.name || "";
          if (recDate) recDate.value = data.signatures.recipient.date || "";
        }
        if (supSig && data.signatures.supplier) {
          supSig.value = data.signatures.supplier.name || "";
          if (supDate) supDate.value = data.signatures.supplier.date || "";
        }
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }

  // Helper function to set form field values by ID or name
  function setValue(field, value) {
    if (value === null || value === undefined) value = "";

    // Try to find element by ID first
    let element = document.getElementById(field);

    // If not found by ID, try to find by name
    if (!element) {
      const elements = document.getElementsByName(field);
      if (elements.length > 0) {
        element = elements[0];
      }
    }

    if (!element) {
      console.warn(`Element not found: ${field}`);
      return;
    }

    if (element.tagName === "SELECT") {
      const option = Array.from(element.options).find(
        (opt) => opt.value === value
      );
      if (option) option.selected = true;
    } else {
      element.value = value;
    }
  }

  // Public API
  return {
    init: init,
  };
})();

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  ReceiptForm.init();
});
