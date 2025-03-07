const { createApp } = Vue

createApp({
    data() {
        return {
            unit: 'lb', // Default to pounds
            barType: "33", // Default to 33lb bar
            builderBarType: "33", // Default to 33lb bar for builder
            targetWeight: "",
            result: null,
            error: null,
            selectedPlates: [], // Array to store selected plates for builder
            showCalculators: false, // Default to hidden
            sessionWeights: [], // Array to store weights for the session
            copiedToClipboard: false, // Flag for showing copy confirmation
            availablePlatesKg: [
                25, // Red plates
                20, // Blue plates
                15, // Yellow plates
                10, // Green plates
                5,  // White plates
                2.5, // Red small plates
                2,  // Blue small plates
                1.5, // Yellow small plates
                1,  // Green small plates
                0.5  // White small plates
            ],
            availablePlatesLb: [
                55, // Red plates
                45, // Blue plates
                35, // Yellow plates
                25, // Green plates
                15, // Yellow small plates
                10, // White plates
                5,  // Red small plates
                2.5 // Small plates
            ]
        }
    },
    created() {
        // Check URL parameters when component is created
        const urlParams = new URLSearchParams(window.location.search);
        this.showCalculators = urlParams.has('showCalc');
    },
    computed: {
        isValidWeight() {
            return this.targetWeight >= parseFloat(this.barType);
        },
        weightToPlatesTotal() {
            if (!this.result) return 0;
            const plateWeight = this.result.reduce((sum, weight) => sum + parseFloat(weight), 0) * 2;
            return parseFloat(this.barType) + plateWeight;
        },
        platesTotal() {
            const plateWeight = this.selectedPlates.reduce((sum, weight) => sum + parseFloat(weight), 0) * 2;
            return parseFloat(this.builderBarType) + plateWeight;
        },
        availablePlates() {
            return this.unit === 'kg' ? this.availablePlatesKg : this.availablePlatesLb;
        },
        formattedSessionWeights() {
            return this.sessionWeights.map(weight => `${weight}${this.unit}`).join(', ');
        }
    },
    methods: {
        addToSession() {
            this.sessionWeights.push(this.platesTotal);
            // Show temporary success message
            this.$nextTick(() => {
                const addButton = document.querySelector('.add-to-session');
                addButton.classList.add('success');
                setTimeout(() => {
                    addButton.classList.remove('success');
                }, 1000);
            });
        },
        copySession() {
            navigator.clipboard.writeText(this.formattedSessionWeights).then(() => {
                this.copiedToClipboard = true;
                setTimeout(() => {
                    this.copiedToClipboard = false;
                }, 2000);
            });
        },
        clearSession() {
            this.sessionWeights = [];
        },
        getRequiredPlates(plates) {
            // Count the occurrences of each plate and sort by weight
            const plateCounts = {};
            plates.forEach(plate => {
                plateCounts[plate] = (plateCounts[plate] || 0) + 1;
            });
            // Sort plates by weight (descending)
            return Object.fromEntries(
                Object.entries(plateCounts)
                    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
            );
        },
        handleUnitChange() {
            // Convert bar types
            const barWeightMap = {
                "45": "20", "33": "15", "22": "10", "15": "6.8",  // lb to kg
                "20": "45", "15": "33", "10": "22", "6.8": "15"   // kg to lb
            };
            
            this.barType = barWeightMap[this.barType] || this.barType;
            this.builderBarType = barWeightMap[this.builderBarType] || this.builderBarType;
            
            // Convert target weight if it exists
            if (this.targetWeight) {
                this.targetWeight = this.unit === 'kg' 
                    ? (this.targetWeight * 0.453592).toFixed(1) // lb to kg
                    : (this.targetWeight * 2.20462).toFixed(1); // kg to lb
            }

            // Convert selected plates
            this.selectedPlates = this.selectedPlates.map(weight => {
                const converted = this.unit === 'kg'
                    ? (parseFloat(weight) * 0.453592).toFixed(1) // lb to kg
                    : (parseFloat(weight) * 2.20462).toFixed(1); // kg to lb
                return parseFloat(converted);
            });

            // Convert session weights
            this.sessionWeights = this.sessionWeights.map(weight => {
                const converted = this.unit === 'kg'
                    ? (parseFloat(weight) * 0.453592).toFixed(1) // lb to kg
                    : (parseFloat(weight) * 2.20462).toFixed(1); // kg to lb
                return parseFloat(converted);
            });

            // Clear result when changing units
            this.result = null;
            this.error = null;
        },
        calculatePlates() {
            this.error = null;
            this.result = null;

            const barWeight = parseFloat(this.barType);
            const targetWeight = parseFloat(this.targetWeight);

            if (targetWeight < barWeight) {
                this.error = `Weight must be at least ${barWeight}${this.unit} (bar weight)`;
                return;
            }

            const weightToAdd = (targetWeight - barWeight) / 2; // Divide by 2 because we need plates for each side
            let remainingWeight = weightToAdd;
            const plates = [];

            // Calculate plates needed
            for (const plate of this.availablePlates) {
                while (remainingWeight >= plate) {
                    plates.push(plate);
                    remainingWeight -= plate;
                }
            }

            // Check if we couldn't match the exact weight
            if (remainingWeight > 0) {
                const actualWeight = targetWeight - (remainingWeight * 2);
                this.error = `Cannot make exact weight. Closest possible: ${actualWeight.toFixed(1)}${this.unit}`;
            }

            this.result = plates;
        },
        addPlate(weight) {
            this.selectedPlates.push(weight);
            // Sort plates in descending order
            this.selectedPlates.sort((a, b) => b - a);
        },
        removePlate(index) {
            this.selectedPlates.splice(index, 1);
        },
        clearPlates() {
            this.selectedPlates = [];
        },
        revealCalculators() {
            // Add showCalc parameter to URL
            const url = new URL(window.location.href);
            url.searchParams.set('showCalc', '');
            window.history.pushState({}, '', url);
            this.showCalculators = true;
        }
    }
}).mount('#app')
