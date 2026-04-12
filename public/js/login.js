/* ====================================================
   RadiusX -- login.js
   Fully wired to backend via api.js
   ==================================================== */


/* ================================================================
   INIT
   ================================================================ */

document.addEventListener("DOMContentLoaded", function () {
  var params = new URLSearchParams(window.location.search)
  var tab    = params.get("tab")

  api.init().then(function (loggedIn) {
    if (loggedIn) {
      api.get("/auth/me", { noRedirect: true }).then(function (res) {
        if (!res.success) return
        if (res.user.role === "admin")  { window.location.href = "admin-dashboard.html"; return }
        if (res.user.role === "seller") { window.location.href = "seller-dashboard.html"; return }
        window.location.href = "index.html"
      })
    }
  })

  if (tab === "signup")       switchTab("signup")
  else if (tab === "seller")  switchTab("seller")
  else                        switchTab("signin")
})


/* ================================================================
   TAB SWITCHING
   ================================================================ */

function switchTab(tab) {
  var indicator  = document.getElementById("tabIndicator")
  var tabSignIn  = document.getElementById("tabSignIn")
  var tabSignUp  = document.getElementById("tabSignUp")
  var tabSeller  = document.getElementById("tabSeller")
  var formSignIn = document.getElementById("formSignIn")
  var formSignUp = document.getElementById("formSignUp")
  var formSeller = document.getElementById("formSeller")

  tabSignIn.classList.remove("active")
  tabSignUp.classList.remove("active")
  tabSeller.classList.remove("active")
  formSignIn.classList.add("hidden")
  formSignUp.classList.add("hidden")
  formSeller.classList.add("hidden")
  indicator.classList.remove("pos-2", "pos-3")

  if (tab === "signin") {
    tabSignIn.classList.add("active")
    formSignIn.classList.remove("hidden")
    formSignIn.style.animation = "none"
    formSignIn.offsetHeight
    formSignIn.style.animation = ""
  } else if (tab === "signup") {
    tabSignUp.classList.add("active")
    indicator.classList.add("pos-2")
    formSignUp.classList.remove("hidden")
    formSignUp.style.animation = "none"
    formSignUp.offsetHeight
    formSignUp.style.animation = ""
  } else if (tab === "seller") {
    tabSeller.classList.add("active")
    indicator.classList.add("pos-3")
    formSeller.classList.remove("hidden")
    formSeller.style.animation = "none"
    formSeller.offsetHeight
    formSeller.style.animation = ""
  }
}


/* ================================================================
   PASSWORD TOGGLE
   ================================================================ */

function togglePassword(fieldId, icon) {
  var input = document.getElementById(fieldId)
  if (input.type === "password") {
    input.type = "text"
    icon.classList.remove("fa-eye")
    icon.classList.add("fa-eye-slash")
  } else {
    input.type = "password"
    icon.classList.remove("fa-eye-slash")
    icon.classList.add("fa-eye")
  }
}


/* ================================================================
   PASSWORD STRENGTH
   ================================================================ */

function checkStrength(value) {
  applyStrength(value,
    document.getElementById("strengthFill"),
    document.getElementById("strengthLabel"))
}

function checkSellerStrength(value) {
  applyStrength(value,
    document.getElementById("sl-strengthFill"),
    document.getElementById("sl-strengthLabel"))
}

function applyStrength(value, fill, label) {
  var score = 0
  if (value.length >= 8)            score++
  if (/[A-Z]/.test(value))          score++
  if (/[0-9]/.test(value))          score++
  if (/[^A-Za-z0-9]/.test(value))   score++

  var widths = ["0%","25%","50%","75%","100%"]
  var colors = ["transparent","rgb(255,80,80)","rgb(255,160,50)","rgb(196,223,154)","rgb(100,210,130)"]
  var labels = ["","Weak","Fair","Good","Strong"]

  fill.style.width      = widths[score]
  fill.style.background = colors[score]
  label.innerText       = labels[score]
  label.style.color     = colors[score]
}


/* ================================================================
   PINCODE LOOKUP
   ================================================================ */

var pincodeTimer   = null
var slPincodeTimer = null

async function fetchPincode(value) {
  var info = document.getElementById("pincodeInfo")
  var err  = document.getElementById("suPincodeErr")
  info.innerText = ""
  err.innerText  = ""
  if (value.length !== 6 || isNaN(value)) return
  info.innerText = "Looking up..."
  clearTimeout(pincodeTimer)
  pincodeTimer = setTimeout(async function () {
    try {
      var res  = await fetch("https://api.postalpincode.in/pincode/" + value)
      var data = await res.json()
      if (data[0].Status === "Success") {
        var place = data[0].PostOffice[0]
        info.innerText = place.District + ", " + place.State
        var f = document.getElementById("suAddress")
        if (!f.value) f.placeholder = place.District + ", " + place.State
      } else {
        err.innerText = "Invalid pincode"
        info.innerText = ""
      }
    } catch (e) { info.innerText = "" }
  }, 500)
}

async function fetchSellerPincode(value) {
  var info = document.getElementById("sl-pincodeInfo")
  var err  = document.getElementById("sl-pincodeErr")
  info.innerText = ""
  err.innerText  = ""
  if (value.length !== 6 || isNaN(value)) return
  info.innerText = "Looking up..."
  clearTimeout(slPincodeTimer)
  slPincodeTimer = setTimeout(async function () {
    try {
      var res  = await fetch("https://api.postalpincode.in/pincode/" + value)
      var data = await res.json()
      if (data[0].Status === "Success") {
        var place = data[0].PostOffice[0]
        info.innerText = place.District + ", " + place.State
        var f = document.getElementById("sl-storeAddr")
        if (!f.value) f.placeholder = place.District + ", " + place.State
      } else {
        err.innerText = "Invalid pincode"
        info.innerText = ""
      }
    } catch (e) { info.innerText = "" }
  }, 500)
}


/* ================================================================
   VALIDATION HELPERS
   ================================================================ */

function setError(fieldId, errId, message) {
  var el   = document.getElementById(fieldId)
  var wrap = el ? el.closest(".input-wrap") : null
  var err  = document.getElementById(errId)
  if (wrap) wrap.classList.add("error")
  if (err)  err.innerText = message
  return false
}

function clearError(fieldId, errId) {
  var el   = document.getElementById(fieldId)
  var wrap = el ? el.closest(".input-wrap") : null
  var err  = document.getElementById(errId)
  if (wrap) wrap.classList.remove("error")
  if (err)  err.innerText = ""
}

function clearAllErrors(ids) {
  ids.forEach(function (pair) { clearError(pair[0], pair[1]) })
}

function setBtnLoading(btn, loading, html) {
  if (!btn) return
  btn.disabled = loading
  if (loading) {
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Please wait...'
  } else {
    btn.innerHTML = html
  }
}


/* ================================================================
   SIGN IN -- POST /auth/login
   ================================================================ */

async function handleSignIn() {
  clearAllErrors([
    ["siIdentifier","siIdentifierErr"],
    ["siPassword","siPasswordErr"]
  ])

  var identifier = document.getElementById("siIdentifier").value.trim()
  var password   = document.getElementById("siPassword").value
  var valid      = true

  if (!identifier) { setError("siIdentifier","siIdentifierErr","Email or mobile is required"); valid = false }
  if (!password)   { setError("siPassword","siPasswordErr","Password is required");            valid = false }
  if (!valid) return

  var btn     = document.querySelector("#formSignIn .auth-btn")
  var btnHTML = "<span>Sign In</span><i class='fa-solid fa-arrow-right'></i>"
  setBtnLoading(btn, true, btnHTML)

  var res = await api.login(identifier, password)

  setBtnLoading(btn, false, btnHTML)

  if (!res.success) {
    setError("siPassword","siPasswordErr", res.message || "Incorrect credentials.")
    return
  }

  localStorage.setItem("rx_user_role", res.user.role)
  localStorage.setItem("rx_user_name", res.user.name)

  showToast("Welcome back, " + res.user.name + "!")

  setTimeout(function () {
    if (res.user.role === "admin")  { window.location.href = "admin-dashboard.html"; return }
    if (res.user.role === "seller") { window.location.href = "seller-dashboard.html"; return }
    window.location.href = "index.html"
  }, 1000)
}


/* ================================================================
   SIGN UP -- POST /auth/register
   ================================================================ */

async function handleSignUp() {
  var fields = [
    ["suName","suNameErr"],["suEmail","suEmailErr"],["suMobile","suMobileErr"],
    ["suPincode","suPincodeErr"],["suAddress","suAddressErr"],
    ["suPassword","suPasswordErr"],["suConfirm","suConfirmErr"]
  ]
  clearAllErrors(fields)

  var name     = document.getElementById("suName").value.trim()
  var email    = document.getElementById("suEmail").value.trim()
  var mobile   = document.getElementById("suMobile").value.trim()
  var pincode  = document.getElementById("suPincode").value.trim()
  var address  = document.getElementById("suAddress").value.trim()
  var password = document.getElementById("suPassword").value
  var confirm  = document.getElementById("suConfirm").value
  var terms    = document.getElementById("suTerms").checked
  var valid    = true

  if (!name || name.length < 2)                            { setError("suName","suNameErr","Enter a valid full name");               valid = false }
  if (!email || !/^[^\s@]+@gmail\.com$/.test(email))       { setError("suEmail","suEmailErr","Enter a valid Gmail address");         valid = false }
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile))             { setError("suMobile","suMobileErr","Enter a valid 10-digit mobile");     valid = false }
  if (!pincode || pincode.length !== 6 || isNaN(pincode))   { setError("suPincode","suPincodeErr","Enter a valid 6-digit pincode");  valid = false }
  if (!address || address.length < 6)                      { setError("suAddress","suAddressErr","Enter your residential address");  valid = false }
  if (!password || password.length < 8)                    { setError("suPassword","suPasswordErr","Min 8 characters");             valid = false }
  if (password !== confirm)                                { setError("suConfirm","suConfirmErr","Passwords do not match");          valid = false }
  if (!terms) { showToast("Please accept the Terms & Conditions"); valid = false }
  if (!valid) return

  var btn     = document.querySelector("#formSignUp .auth-btn")
  var btnHTML = "<span>Create Account</span><i class='fa-solid fa-arrow-right'></i>"
  setBtnLoading(btn, true, btnHTML)

  var res = await api.register({ name: name, email: email, mobile: mobile, password: password, pincode: pincode, address: address })

  setBtnLoading(btn, false, btnHTML)

  if (!res.success) {
    if (res.errors) {
      res.errors.forEach(function (e) {
        if (e.field === "email")  setError("suEmail","suEmailErr",  e.message)
        if (e.field === "mobile") setError("suMobile","suMobileErr", e.message)
      })
    } else {
      showToast(res.message || "Registration failed.")
    }
    return
  }

  localStorage.setItem("rx_user_role", "buyer")
  localStorage.setItem("rx_user_name", res.user.name)

  showToast("Welcome, " + res.user.name + "! Account created!")
  setTimeout(function () { window.location.href = "index.html" }, 1200)
}


/* ================================================================
   SELLER REGISTRATION -- POST /seller/apply
   3-step UI unchanged. Only final submit talks to API.
   ================================================================ */

var sellerCurrentStep = 1
var sellerData        = {}
var sellerDocs        = { pan: "", gst: "", biz: "", bank: "" }

function updateStepUI(s) {
  for (var i = 1; i <= 3; i++) {
    var dot  = document.getElementById("step-dot-" + i)
    var conn = document.querySelectorAll(".step-connector")[i - 1]
    dot.classList.remove("active","done")
    if (i < s)      { dot.classList.add("done");   if (conn) conn.classList.add("done"); }
    else if (i===s) { dot.classList.add("active"); if (conn) conn.classList.remove("done"); }
    else            {                               if (conn) conn.classList.remove("done"); }
  }
}

function showStep(n) {
  for (var i = 1; i <= 3; i++) document.getElementById("sellerStep" + i).classList.add("hidden")
  document.getElementById("sellerStep" + n).classList.remove("hidden")
  sellerCurrentStep = n
  updateStepUI(n)
}

function sellerNextStep(from) {
  if (from === 1) {
    if (!validateSellerStep1()) return
    sellerData.ownerName = document.getElementById("sl-ownerName").value.trim()
    sellerData.email     = document.getElementById("sl-email").value.trim()
    sellerData.mobile    = document.getElementById("sl-mobile").value.trim()
    sellerData.bizType   = document.getElementById("sl-bizType").value
    sellerData.bizName   = document.getElementById("sl-bizName").value.trim()
    sellerData.gst       = document.getElementById("sl-gst").value.trim()
    sellerData.pan       = document.getElementById("sl-pan").value.trim()
    showStep(2)
  } else if (from === 2) {
    if (!validateSellerStep2()) return
    sellerData.storeName = document.getElementById("sl-storeName").value.trim()
    sellerData.storeDesc = document.getElementById("sl-storeDesc").value.trim()
    sellerData.category  = document.getElementById("sl-category").value
    sellerData.pincode   = document.getElementById("sl-pincode").value.trim()
    sellerData.storeAddr = document.getElementById("sl-storeAddr").value.trim()
    sellerData.password  = document.getElementById("sl-password").value
    showStep(3)
  }
}

function sellerBackStep(from) { showStep(from - 1) }

function validateSellerStep1() {
  clearAllErrors([["sl-ownerName","sl-ownerNameErr"],["sl-email","sl-emailErr"],
    ["sl-mobile","sl-mobileErr"],["sl-bizType","sl-bizTypeErr"],
    ["sl-bizName","sl-bizNameErr"],["sl-pan","sl-panErr"]])
  var v = true
  var ownerName = document.getElementById("sl-ownerName").value.trim()
  var email     = document.getElementById("sl-email").value.trim()
  var mobile    = document.getElementById("sl-mobile").value.trim()
  var bizType   = document.getElementById("sl-bizType").value
  var bizName   = document.getElementById("sl-bizName").value.trim()
  var gst       = document.getElementById("sl-gst").value.trim()
  var pan       = document.getElementById("sl-pan").value.trim()
  if (!ownerName || ownerName.length < 2)                      { setError("sl-ownerName","sl-ownerNameErr","Enter owner name"); v=false }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))    { setError("sl-email","sl-emailErr","Valid email required");     v=false }
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile))                 { setError("sl-mobile","sl-mobileErr","Valid 10-digit mobile");  v=false }
  if (!bizType)                                                 { setError("sl-bizType","sl-bizTypeErr","Select business type"); v=false }
  if (!bizName || bizName.length < 3)                          { setError("sl-bizName","sl-bizNameErr","Enter business name");  v=false }
  if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) { setError("sl-gst","sl-gstErr","Invalid GST"); v=false }
  if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))           { setError("sl-pan","sl-panErr","Valid PAN required");           v=false }
  return v
}

function validateSellerStep2() {
  clearAllErrors([["sl-storeName","sl-storeNameErr"],["sl-storeDesc","sl-storeDescErr"],
    ["sl-category","sl-categoryErr"],["sl-pincode","sl-pincodeErr"],
    ["sl-storeAddr","sl-storeAddrErr"],["sl-password","sl-passwordErr"],["sl-confirm","sl-confirmErr"]])
  var v = true
  var storeName = document.getElementById("sl-storeName").value.trim()
  var storeDesc = document.getElementById("sl-storeDesc").value.trim()
  var category  = document.getElementById("sl-category").value
  var pincode   = document.getElementById("sl-pincode").value.trim()
  var storeAddr = document.getElementById("sl-storeAddr").value.trim()
  var password  = document.getElementById("sl-password").value
  var confirm   = document.getElementById("sl-confirm").value
  if (!storeName || storeName.length < 3)             { setError("sl-storeName","sl-storeNameErr","Enter store name");    v=false }
  if (!storeDesc || storeDesc.length < 10)            { setError("sl-storeDesc","sl-storeDescErr","Min 10 characters");  v=false }
  if (!category)                                      { setError("sl-category","sl-categoryErr","Select category");      v=false }
  if (!pincode||pincode.length!==6||isNaN(pincode))   { setError("sl-pincode","sl-pincodeErr","Valid 6-digit pincode");  v=false }
  if (!storeAddr || storeAddr.length < 8)             { setError("sl-storeAddr","sl-storeAddrErr","Enter store address");v=false }
  if (!password || password.length < 8)               { setError("sl-password","sl-passwordErr","Min 8 characters");    v=false }
  if (password !== confirm)                           { setError("sl-confirm","sl-confirmErr","Passwords do not match"); v=false }
  return v
}

async function handleSellerSubmit() {
  document.getElementById("sl-panDocErr").innerText  = ""
  document.getElementById("sl-bizDocErr").innerText  = ""
  document.getElementById("sl-bankDocErr").innerText = ""
  clearAllErrors([["sl-accName","sl-accNameErr"],["sl-bankName","sl-bankNameErr"],
    ["sl-accNo","sl-accNoErr"],["sl-ifsc","sl-ifscErr"]])

  var accName  = document.getElementById("sl-accName").value.trim()
  var bankName = document.getElementById("sl-bankName").value.trim()
  var accNo    = document.getElementById("sl-accNo").value.trim()
  var ifsc     = document.getElementById("sl-ifsc").value.trim()
  var terms    = document.getElementById("slTerms").checked
  var v = true

  if (!accName || accName.length < 2)                  { setError("sl-accName","sl-accNameErr","Enter account holder name"); v=false }
  if (!bankName || bankName.length < 2)                { setError("sl-bankName","sl-bankNameErr","Enter bank name");         v=false }
  if (!accNo || accNo.length < 9)                      { setError("sl-accNo","sl-accNoErr","Enter valid account number");    v=false }
  if (!ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) { setError("sl-ifsc","sl-ifscErr","Enter valid IFSC");                v=false }
  if (!sellerDocs.pan)  { document.getElementById("sl-panDocErr").innerText  = "Upload PAN card";         v=false }
  if (!sellerDocs.biz)  { document.getElementById("sl-bizDocErr").innerText  = "Upload business proof";   v=false }
  if (!sellerDocs.bank) { document.getElementById("sl-bankDocErr").innerText = "Upload cancelled cheque"; v=false }
  if (!terms) { showToast("Please accept Seller Terms & Conditions"); v=false }
  if (!v) return

  var submitBtn = document.querySelector("#sellerStep3 .step-submit-btn")
  if (submitBtn) submitBtn.disabled = true
  showToast("Submitting application...")

  var payload = Object.assign({}, sellerData, {
    accName: accName, bankName: bankName, accNo: accNo, ifsc: ifsc
  })

  var res = await api.post("/seller/apply", payload)

  if (submitBtn) submitBtn.disabled = false

  if (!res.success) {
    if (res.message && res.message.toLowerCase().includes("email")) {
      showStep(1)
      setError("sl-email","sl-emailErr", res.message)
    } else {
      showToast(res.message || "Submission failed. Please try again.")
    }
    return
  }

  showSellerSuccess(sellerData.ownerName, sellerData.storeName)
}

function showSellerSuccess(ownerName, storeName) {
  document.getElementById("formSeller").innerHTML =
    '<div style="text-align:center;padding:40px 0">' +
    '<div style="font-size:56px;margin-bottom:20px">\uD83C\uDF89</div>' +
    '<h2 style="font-family:\'Playfair Display\',serif;font-size:24px;color:var(--accent);margin-bottom:12px">Application Submitted!</h2>' +
    '<p style="color:var(--muted);font-size:14px;line-height:1.7;max-width:340px;margin:0 auto 10px">Hi <strong style="color:var(--text)">' + ownerName + '</strong>, your store <strong style="color:var(--text)">' + storeName + '</strong> is under review.</p>' +
    '<p style="color:var(--muted);font-size:13px;line-height:1.7;max-width:340px;margin:0 auto 28px">Our team will verify documents within <strong style="color:var(--accent)">24-48 hours</strong>.</p>' +
    '<a href="index.html" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:var(--accent);color:rgb(8,12,16);border-radius:8px;text-decoration:none;font-weight:700;font-size:14px"><i class="fa-solid fa-house"></i> Back to RadiusX</a>' +
    '</div>'
}

function triggerUpload(inputId, boxId, nameId) { document.getElementById(inputId).click() }

function handleUpload(inputId, boxId, nameId) {
  var input = document.getElementById(inputId)
  var box   = document.getElementById(boxId)
  var label = document.getElementById(nameId)
  if (!input.files || !input.files[0]) return
  var file = input.files[0]
  if (file.size > 5 * 1024 * 1024) { showToast("File too large. Max 5 MB."); input.value = ""; return }
  label.innerText = "\u2713 " + file.name
  box.classList.add("uploaded")
  if (inputId === "filePAN")  sellerDocs.pan  = file.name
  if (inputId === "fileGST")  sellerDocs.gst  = file.name
  if (inputId === "fileBiz")  sellerDocs.biz  = file.name
  if (inputId === "fileBank") sellerDocs.bank = file.name
}


/* ================================================================
   MODALS
   ================================================================ */

var modalContents = {
  forgot: '<h3>Forgot Password</h3><p>Enter your registered email or mobile.</p><div class="modal-input-wrap"><i class="fa-regular fa-envelope"></i><input type="text" id="forgotInput" placeholder="Email or Mobile"></div><button class="modal-btn" onclick="handleForgot()">Send Reset Link</button>',
  seller: '<h3>Become a Seller</h3><p>Join RadiusX as a local seller and reach customers near you.</p><p>You will need GST/business number, bank details, and store photos.</p><br><button class="modal-btn" onclick="closeModal(); switchTab(\'seller\')">Start Registration</button>',
  help:   '<h3>Help &amp; Support</h3><p>Email: support.radiusx@gmail.com</p><p>Helpline: 1800-XXX-XXXX (9AM-9PM)</p><br><button class="modal-btn" onclick="closeModal()">Got it</button>'
}

function showModal(type) {
  document.getElementById("modalContent").innerHTML = modalContents[type] || ""
  document.getElementById("modalOverlay").classList.add("open")
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open")
}

function handleForgot() {
  var val = document.getElementById("forgotInput").value.trim()
  if (!val) return
  showToast("Reset link sent to " + val)
  closeModal()
}


/* ================================================================
   TOAST
   ================================================================ */

var toastTimer = null

function showToast(message) {
  var toast = document.getElementById("toast")
  toast.innerText = message
  toast.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(function () { toast.classList.remove("show") }, 2800)
}


/* ================================================================
   GOOGLE OAUTH
   ================================================================ */

function signInWithGoogle() {
  /* Redirect to backend Google OAuth route */
  window.location.href = api.BASE + "/auth/google";
}

/* On page load, check if we just came back from Google OAuth.
   Backend redirects to: login.html?oauth_token=xxx&role=yyy
   or login.html?oauth_error=1 on failure                        */
(function handleOAuthReturn() {
  var params    = new URLSearchParams(window.location.search);
  var token     = params.get("oauth_token");
  var role      = params.get("oauth_error");
  var oauthErr  = params.get("oauth_error");

  if (oauthErr) {
    /* Clean URL then show error */
    window.history.replaceState({}, "", "login.html");
    setTimeout(function() {
      showToast("Google sign-in failed. Please try again.", true);
    }, 300);
    return;
  }

  if (token) {
    api.setToken(token);
    var userRole = params.get("role") || "buyer";
    window.history.replaceState({}, "", "login.html");
    localStorage.setItem("rx_user_role", userRole);

    /* Fetch and cache user so navbar on next page loads instantly */
    api.get("/auth/me", { noRedirect: true }).then(function(res) {
      if (res && res.success) api.setUser(res.user);
    }).catch(function(){});

    showToast("Signed in with Google!");
    setTimeout(function() {
      if (userRole === "admin")  { window.location.href = "admin-dashboard.html"; return; }
      if (userRole === "seller") { window.location.href = "seller-dashboard.html"; return; }
      window.location.href = "index.html";
    }, 800);
  }
})();