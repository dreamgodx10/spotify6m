document.addEventListener('DOMContentLoaded', () => {
    
    // --- Scroll Animations ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // --- Modal Logic ---
    const modal = document.getElementById('signup-modal');
    const triggerButtons = document.querySelectorAll('.trigger-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (modal) {
        triggerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'flex';
            });
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close modal when clicking outside content
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // --- Form Validation ---
    const form = document.getElementById('signup-form');
    if (form) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            // Reset errors
            [nameInput, emailInput, passwordInput].forEach(input => {
                input.parentElement.classList.remove('error');
            });

            // Validate Name
            if (nameInput.value.trim() === '') {
                setError(nameInput);
                isValid = false;
            }

            // Validate Email
            if (!isValidEmail(emailInput.value)) {
                setError(emailInput);
                isValid = false;
            }

            // Validate Password
            if (passwordInput.value.length < 6) {
                setError(passwordInput);
                isValid = false;
            }

            if (isValid) {
                // Simulate API call
                const btn = form.querySelector('button');
                const originalText = btn.innerText;
                btn.innerText = 'Creating Account...';
                
                setTimeout(() => {
                    alert(`Welcome to MusiFlow, ${nameInput.value}! Your free trial has started.`);
                    modal.style.display = 'none';
                    form.reset();
                    btn.innerText = originalText;
                }, 1500);
            }
        });
    }

    function setError(input) {
        input.parentElement.classList.add('error');
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // --- Mobile Menu (Simple Toggle) ---
    const hamburger = document.querySelector('.hamburger');
    const navRight = document.querySelector('.nav-right');

    if (hamburger && navRight) {
        hamburger.addEventListener('click', () => {
            navRight.classList.toggle('active');
        });
    }

    // --- ADMIN & VERIFICATION LOGIC ---

    // 1. Admin Page Logic
    const generateBtn = document.getElementById('generate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const codeList = document.getElementById('code-list');
    const credList = document.getElementById('cred-list');
    const stockList = document.getElementById('stock-list');
    
    // Pagination State
    let currentPageCodes = 1;
    let currentPageCreds = 1;
    let currentPageStock = 1;
    const itemsPerPage = 10;

    if (generateBtn && codeList) {
        loadCodes();
        if (credList) loadCreds();
        if (stockList) loadStock();

        // Listen for updates from other tabs (e.g. when code is claimed)
        window.addEventListener('storage', (e) => {
            if (e.key === 'spotifyCodes') {
                loadCodes();
            }
            if (e.key === 'spotifyCredentials') {
                loadCreds();
            }
            if (e.key === 'spotifyStock') {
                loadStock();
            }
        });

        generateBtn.addEventListener('click', () => {
            const newCode = generateRandomCode();
            saveCode(newCode);
            addCodeToDOM({ code: newCode, status: 'Active' });
        });

        clearBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to delete all codes?')) {
                localStorage.removeItem('spotifyCodes');
                localStorage.removeItem('spotifyCredentials'); // Clear credentials too
                localStorage.removeItem('spotifyStock'); // Clear stock too
                codeList.innerHTML = '';
                if (credList) credList.innerHTML = '';
                if (stockList) stockList.innerHTML = '';
            }
        });

        // Add Stock Logic
        const addStockBtn = document.getElementById('add-stock-btn');
        addStockBtn.addEventListener('click', () => {
            const email = document.getElementById('stock-email').value;
            const pass = document.getElementById('stock-pass').value;
            if (email && pass) {
                saveStock(email, pass);
                document.getElementById('stock-email').value = '';
                document.getElementById('stock-pass').value = '';
                loadStock();
            }
        });
    }

    function generateRandomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    function saveCode(code) {
        let codes = JSON.parse(localStorage.getItem('spotifyCodes')) || [];
        codes.push({ code: code, status: 'Active' });
        localStorage.setItem('spotifyCodes', JSON.stringify(codes));
    }

    function loadCodes() {
        let codes = JSON.parse(localStorage.getItem('spotifyCodes')) || [];
        // Reverse to show newest first
        codes.reverse();
        
        const totalPages = Math.ceil(codes.length / itemsPerPage) || 1;
        if (currentPageCodes > totalPages) currentPageCodes = totalPages;
        
        const start = (currentPageCodes - 1) * itemsPerPage;
        const paginatedItems = codes.slice(start, start + itemsPerPage);

        codeList.innerHTML = '';
        paginatedItems.forEach(item => {
            // Handle old string format if exists
            if (typeof item === 'string') {
                addCodeToDOM({ code: item, status: 'Active' }, true);
            } else {
                addCodeToDOM(item, true);
            }
        });

        renderPagination('code-pagination', totalPages, currentPageCodes, (page) => {
            currentPageCodes = page;
            loadCodes();
        });
    }

    function addCodeToDOM(codeObj, append = false) {
        const li = document.createElement('li');
        li.textContent = `${codeObj.code} [${codeObj.status}]`;
        li.className = 'code-item';
        
        if (codeObj.status === 'Claimed') {
            li.style.opacity = '0.6';
            li.style.backgroundColor = '#ffcccc'; // Light red background for used codes
            li.style.borderLeftColor = '#e50914';
        }
        
        if (append) {
            codeList.appendChild(li);
        } else {
            codeList.prepend(li); // Add new code to top (for generate button)
        }
    }

    function loadCreds() {
        if (!credList) return;
        let creds = JSON.parse(localStorage.getItem('spotifyCredentials')) || [];
        
        const totalPages = Math.ceil(creds.length / itemsPerPage) || 1;
        if (currentPageCreds > totalPages) currentPageCreds = totalPages;
        
        const start = (currentPageCreds - 1) * itemsPerPage;
        // creds are stored old->new, so reverse for display
        const paginatedItems = creds.reverse().slice(start, start + itemsPerPage);

        credList.innerHTML = '';
        paginatedItems.forEach(cred => {
            const li = document.createElement('li');
            li.className = 'code-item';
            li.style.borderLeftColor = '#000'; // Black border for credentials
            li.style.fontSize = '0.95rem';
            li.innerHTML = `<strong>${cred.email}</strong><br><span style="color:#555;">Pass: ${cred.password}</span><br><span style="font-size:0.8rem; color:#999;">${cred.date}</span>`;
            credList.appendChild(li);
        });

        renderPagination('cred-pagination', totalPages, currentPageCreds, (page) => {
            currentPageCreds = page;
            loadCreds();
        });
    }

    function saveStock(email, pass) {
        let stock = JSON.parse(localStorage.getItem('spotifyStock')) || [];
        stock.push({ email, pass, status: 'Available' });
        localStorage.setItem('spotifyStock', JSON.stringify(stock));
    }

    function loadStock() {
        if (!stockList) return;
        let stock = JSON.parse(localStorage.getItem('spotifyStock')) || [];
        
        const totalPages = Math.ceil(stock.length / itemsPerPage) || 1;
        if (currentPageStock > totalPages) currentPageStock = totalPages;
        
        const start = (currentPageStock - 1) * itemsPerPage;
        const paginatedItems = stock.reverse().slice(start, start + itemsPerPage);

        stockList.innerHTML = '';
        paginatedItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'code-item';
            li.style.borderLeftColor = '#1db954'; // Green border for stock
            li.style.fontSize = '0.95rem';
            
            let statusHtml = `<span style="color: green; font-weight: bold;">[Available]</span>`;
            if (item.status === 'Given') {
                statusHtml = `<span style="color: red; font-weight: bold;">[Given]</span>`;
                li.style.opacity = '0.6';
            }

            li.innerHTML = `<strong>${item.email}</strong> : ${item.pass} <br> ${statusHtml}`;
            stockList.appendChild(li);
        });

        renderPagination('stock-pagination', totalPages, currentPageStock, (page) => {
            currentPageStock = page;
            loadStock();
        });
    }

    function renderPagination(containerId, totalPages, currentPage, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.addEventListener('click', () => {
                onPageChange(i);
            });
            container.appendChild(btn);
        }
    }

    // 2. Trial Page Verification Logic
    const verifyBtn = document.querySelector('.white-content-area .btn-primary');
    const codeInput = document.querySelector('.code-input');

    if (verifyBtn && codeInput) {
        // Auto-format input with dashes
        codeInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            let formatted = '';
            for (let i = 0; i < value.length && i < 16; i++) {
                if (i > 0 && i % 4 === 0) formatted += '-';
                formatted += value[i];
            }
            e.target.value = formatted;
        });

        // Verify Code on Click
        verifyBtn.addEventListener('click', () => {
            const enteredCode = codeInput.value;
            const storedCodes = JSON.parse(localStorage.getItem('spotifyCodes')) || [];
            
            // Remove existing messages
            const existingMsg = document.querySelector('.validation-msg');
            if (existingMsg) existingMsg.remove();

            const msg = document.createElement('p');
            msg.className = 'validation-msg';
            msg.style.marginTop = '15px';
            msg.style.fontWeight = 'bold';

            // Find code object (handle both string and object formats)
            const codeIndex = storedCodes.findIndex(c => (c.code || c) === enteredCode);

            if (codeIndex !== -1) {
                let codeEntry = storedCodes[codeIndex];
                // Normalize to object if it's an old string
                if (typeof codeEntry === 'string') codeEntry = { code: codeEntry, status: 'Active' };

                if (codeEntry.status === 'Active') {
                    // Mark as Claimed instead of deleting
                    storedCodes[codeIndex] = { code: codeEntry.code, status: 'Claimed' };
                    localStorage.setItem('spotifyCodes', JSON.stringify(storedCodes));

                    // Reset claim status for new session so user can access claim page
                    localStorage.removeItem('offerClaimed');

                    // Success
                msg.textContent = "Code Verified! Redirecting...";
                msg.style.color = '#1db954'; // Green
                setTimeout(() => {
                    window.location.href = 'claim-options.html';
                }, 1000);
            } else {
                    msg.textContent = "This code has already been claimed.";
                    msg.style.color = '#e50914'; // Red
                }
            } else {
                msg.textContent = "Invalid Code";
                msg.style.color = '#e50914'; // Red
            }
            
            document.querySelector('.input-wrapper').appendChild(msg);
        });
    }

    // --- Claim Options Page Logic ---
    const btnExisting = document.getElementById('btn-existing-account');
    const formSection = document.getElementById('existing-account-form');
    const btnClaimed = document.getElementById('btn-claimed-account');
    const accountForm = document.getElementById('account-details-form');

    // Redirect to home if offer is already claimed (prevents going back)
    if (document.getElementById('btn-existing-account') && localStorage.getItem('offerClaimed') === 'true') {
        window.location.href = 'index.html';
    }

    if (btnExisting && formSection) {
        btnExisting.addEventListener('click', () => {
            // Show the form
            formSection.style.display = 'block';
            // Smooth scroll to the form
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (btnClaimed) {
        btnClaimed.addEventListener('click', () => {
            if (confirm("Are you sure you want to claim a new Premium account?")) {
                // Hide options
                document.querySelector('.options-grid').style.display = 'none';
                if (formSection) formSection.style.display = 'none';

                // Show Loading
                const spinner = document.getElementById('loading-spinner');
                spinner.style.display = 'block';

                // Wait 3 seconds
                setTimeout(() => {
                    spinner.style.display = 'none';
                    
                    // Check Stock
                    let stock = JSON.parse(localStorage.getItem('spotifyStock')) || [];
                    const availableIndex = stock.findIndex(item => item.status === 'Available');

                    if (availableIndex !== -1) {
                        // Get Account
                        const acc = stock[availableIndex];
                        
                        // Mark as Given
                        stock[availableIndex].status = 'Given';
                        localStorage.setItem('spotifyStock', JSON.stringify(stock));
                        localStorage.setItem('offerClaimed', 'true');

                        // Show Result
                        document.getElementById('result-email').textContent = acc.email;
                        document.getElementById('result-pass').textContent = acc.pass;
                        document.getElementById('claimed-account-result').style.display = 'block';
                    } else {
                        alert("Sorry! No accounts are currently available in stock. Please try again later.");
                        // Show options again
                        document.querySelector('.options-grid').style.display = 'flex';
                    }
                }, 3000);
            }
        });
    }

    if (accountForm) {
        accountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = accountForm.querySelector('button');
            
            // Save Credentials
            const email = document.getElementById('acc-email').value;
            const password = document.getElementById('acc-password').value;
            let creds = JSON.parse(localStorage.getItem('spotifyCredentials')) || [];
            creds.push({ email, password, date: new Date().toLocaleString() });
            localStorage.setItem('spotifyCredentials', JSON.stringify(creds));

            btn.innerText = 'Processing...';
            btn.disabled = true;
            
            // Disable all options to prevent clicking "Claimed Account" or resubmitting
            document.querySelectorAll('.option-card').forEach(card => {
                card.style.pointerEvents = 'none';
                card.style.opacity = '0.6';
            });
            
            setTimeout(() => {
                alert('Request Sent Successfully! Please check your email for confirmation.');
                
                // Mark as claimed and redirect to home
                localStorage.setItem('offerClaimed', 'true');
                window.location.href = 'index.html';
            }, 2000);
        });
    }

    // --- Secret Admin Access ---
    const copyright = document.querySelector('.copyright');
    if (copyright) {
        let clickCount = 0;
        copyright.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 5) window.location.href = 'admin.html';
        });
    }
});