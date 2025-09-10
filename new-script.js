// Main Receipt Form Application
const ReceiptForm = (function () {
  // DOM Elements
  let itemsList, addItemBtn, receiptForm;
  let itemCounter = 0;

  // Show toast notification
  function showToast(message, isError = false) {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${isError ? "error" : ""}`;
    toast.innerHTML = `
      <div class="toast-message">${message}</div>
      <button class="close-btn" aria-label="إغلاق">&times;</button>
    `;

    // Add to container and show
    toastContainer.appendChild(toast);
    // Force reflow to trigger animation
    void toast.offsetWidth;
    toast.classList.add("show");

    // Auto remove after delay
    const autoRemove = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300); // Wait for animation to complete
    }, 2000);

    // Close button handler
    const closeBtn = toast.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        clearTimeout(autoRemove);
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
      });
    }
  }

  // Save all form data to localStorage
  function saveFormData() {
    if (!receiptForm) return;

    const data = {
      // Sender Information
      sender: {
        name: document.querySelector('[name="supplierName"]')?.value || "",
        location: document.querySelector('[name="supplierPhone"]')?.value || "",
      },
      // Receiver Information
      receiver: {
        name: document.querySelector('[name="receiverName"]')?.value || "",
        department:
          document.querySelector('[name="receiverDepartment"]')?.value || "",
      },
      // Delivery Information
      delivery: {
        location:
          document.querySelector('[name="deliveryLocation"]')?.value || "",
        date: document.querySelector('[name="deliveryDate"]')?.value || "",
        time: document.querySelector('[name="deliveryTime"]')?.value || "",
      },
      // Additional Notes
      notes: document.querySelector('[name="additionalNotes"]')?.value || "",
      // Items List
      items: [],
    };

    // Get all items
    const items = [];
    document.querySelectorAll(".item-row:not(.header-row)").forEach((row) => {
      const desc = row.querySelector('[name$="[description]"]')?.value?.trim();
      const quantity =
        row.querySelector('[name$="[quantity]"]')?.value?.trim() || "1";
      const condition =
        row.querySelector('[name$="[condition]"]')?.value?.trim() || "";
      const notes = row.querySelector('[name$="[notes]"]')?.value?.trim() || "";

      // Only add the item if it has a description or notes
      if (desc) {
        const item = {
          description: desc,
        };

        // Only add quantity if it's not empty or not "1"
        if (quantity && quantity !== "1") {
          item.quantity = quantity;
        } else {
          item.quantity = "1";
        }

        // Only add condition if it's not empty
        if (condition) {
          item.condition = condition;
        }

        // Only add notes if it's not empty
        if (notes) {
          item.notes = notes;
        }

        items.push(item);
      }
    });

    // Only save items if there are any
    if (items.length > 0) {
      data.items = items;
    }

    // Only save to localStorage if there's actual data
    if (
      data.items.length > 0 ||
      data.sender.name ||
      data.sender.location ||
      data.receiver.name ||
      data.receiver.department ||
      data.delivery.location ||
      data.delivery.date ||
      data.delivery.time ||
      data.notes
    ) {
      try {
        localStorage.setItem("formData", JSON.stringify(data));
        console.log("تم حفظ البيانات بنجاح");
      } catch (error) {
        console.error("حدث خطأ أثناء حفظ البيانات:", error);
        showToast("حدث خطأ أثناء حفظ البيانات", true);
      }
    } else {
      // If no data to save, remove any existing data
      localStorage.removeItem("formData");
    }
  }

  // Initialize the application
  function init() {
    // Get DOM elements
    itemsList = document.getElementById("itemsList");
    addItemBtn = document.getElementById("addItemBtn");
    receiptForm = document.getElementById("receiptForm");
    const saveBtn = document.getElementById("saveForm");
    const resetBtn = document.getElementById("resetForm");
    const printBtn = document.getElementById("printForm");

    // Setup auto-save every 5 seconds
    setInterval(saveFormData, 5000);

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
          window.removeEventListener("afterprint", afterPrint);
        };

        window.addEventListener("afterprint", afterPrint, { once: true });

        // Trigger print
        setTimeout(() => {
          try {
            window.print();
          } catch (err) {
            console.error("Print error:", err);
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

    document.getElementById(`item-desc-${itemId}`).focus();

    return itemRow;
  }

  // Handle form submission
  function handleFormSubmit(e) {
    if (e) e.preventDefault();
    saveFormData();
    showToast("تم حفظ النموذج بنجاح!");
    return false;
  }

  // Handle form reset
  function handleFormReset() {
    receiptForm.reset();
    itemCounter = 1;
    addHeaderRow();
    addItemRow();
    localStorage.removeItem("formData");
    showToast("تم إعادة تعيين النموذج بنجاح");
  }

  // Load saved form data
  function loadFormData() {
    try {
      const savedData = localStorage.getItem("formData");
      if (!savedData) return;

      const data = JSON.parse(savedData);
      console.log("Loading saved data:", data);

      // Restore sender information
      if (data.sender) {
        setValue("supplierName", data.sender.name || "");
        setValue("supplierPhone", data.sender.location || "");
      }

      // Restore receiver information
      if (data.receiver) {
        setValue("receiverName", data.receiver.name || "");
        setValue("receiverDepartment", data.receiver.department || "");
      }

      // Restore delivery information
      if (data.delivery) {
        setValue("deliveryLocation", data.delivery.location || "");
        setValue("deliveryDate", data.delivery.date || "");
        setValue("deliveryTime", data.delivery.time || "");
      }

      // Restore additional notes
      if (data.notes) {
        setValue("additionalNotes", data.notes);
      }

      // Restore items
      if (data.items && data.items.length > 0) {
        // Clear existing items
        addHeaderRow();
        itemCounter = 0; // Reset counter

        // Add items
        data.items.forEach((item) => {
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
      } else {
        // If no items, ensure at least one empty row exists
        addItemRow();
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
