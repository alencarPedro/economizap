var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _this = this;
console.log('Starting WhatsApp bot server...');
var _a = require('whatsapp-web.js'), Client = _a.Client, LocalAuth = _a.LocalAuth;
// Import using require to ensure compatibility
var qrcode = require('qrcode-terminal');
var dotenv = require('dotenv');
var createClient = require('@supabase/supabase-js').createClient;
var _b = require('date-fns'), format = _b.format, parse = _b.parse;
var ptBR = require('date-fns/locale').ptBR;
var OpenAI = require('openai').OpenAI;
// Load environment variables
console.log('Loading environment variables...');
dotenv.config();
console.log('Environment variables loaded.');
// Debug all environment variables
console.log('All environment variables:');
console.log(Object.keys(process.env).filter(function (key) { return key.includes('SUPABASE'); }));
// Initialize Supabase client
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
console.log('Supabase URL:', supabaseUrl);
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
console.log('Supabase Key available:', supabaseKey ? 'Yes' : 'No');
if (!supabaseUrl) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is required');
    process.exit(1);
}
if (!supabaseKey) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}
var supabase = createClient(supabaseUrl, supabaseKey);
// Initialize OpenAI client
var openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
var conversationHistory = {};
var MAX_HISTORY_LENGTH = 10; // Maximum number of messages to keep in history
// Simplify the formatWhatsAppId function
function formatWhatsAppId(whatsappId) {
    // Extract just the numbers from the WhatsApp ID
    return whatsappId.replace('@c.us', '').replace(/[^0-9]/g, '');
}
// Add a function to check if a table uses UUID format for user_id
function checkTableUserIdFormat(tableName) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase.rpc('get_column_type', {
                            table_name: tableName,
                            column_name: 'user_id',
                        })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error checking column type for ".concat(tableName, ":"), error);
                        // Default to string format if we can't determine
                        return [2 /*return*/, false];
                    }
                    // If the column type is uuid, return true
                    return [2 /*return*/, data === 'uuid'];
                case 2:
                    error_1 = _b.sent();
                    console.error("Error in checkTableUserIdFormat for ".concat(tableName, ":"), error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Simplify the getUserRecentExpenses function
function getUserRecentExpenses(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, userData, userError, _b, expenses, error, expensesText_1, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase.from('users').select('id').eq('phone', userId).single()];
                case 1:
                    _a = _c.sent(), userData = _a.data, userError = _a.error;
                    if (userError) {
                        console.error('Error fetching user for expenses:', userError);
                        return [2 /*return*/, 'Não foi possível recuperar suas despesas recentes.'];
                    }
                    if (!userData || !userData.id) {
                        return [2 /*return*/, 'Usuário não encontrado.'];
                    }
                    return [4 /*yield*/, supabase
                            .from('expenses')
                            .select('*')
                            .eq('user_id', userData.id)
                            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                            .order('created_at', { ascending: false })];
                case 2:
                    _b = _c.sent(), expenses = _b.data, error = _b.error;
                    if (error)
                        throw error;
                    if (!expenses || expenses.length === 0) {
                        return [2 /*return*/, 'Você não tem despesas registradas nos últimos 30 dias.'];
                    }
                    expensesText_1 = 'Despesas recentes (últimos 30 dias):\n';
                    expenses.forEach(function (expense) {
                        var date = new Date(expense.created_at).toLocaleDateString('pt-BR');
                        expensesText_1 += "- ".concat(date, ": ").concat(expense.description, " (").concat(expense.category, ") - R$ ").concat(expense.amount.toFixed(2), "\n");
                    });
                    return [2 /*return*/, expensesText_1];
                case 3:
                    error_2 = _c.sent();
                    console.error('Error fetching recent expenses:', error_2);
                    return [2 /*return*/, 'Não foi possível recuperar suas despesas recentes.'];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Simplify the getUserSavingsGoals function
function getUserSavingsGoals(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, userData, userError, _b, goals, error, goalsText_1, error_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase.from('users').select('id').eq('phone', userId).single()];
                case 1:
                    _a = _c.sent(), userData = _a.data, userError = _a.error;
                    if (userError) {
                        console.error('Error fetching user for goals:', userError);
                        return [2 /*return*/, 'Não foi possível recuperar suas metas de economia.'];
                    }
                    if (!userData || !userData.id) {
                        return [2 /*return*/, 'Usuário não encontrado.'];
                    }
                    return [4 /*yield*/, supabase
                            .from('savings_goals')
                            .select('*')
                            .eq('user_id', userData.id)
                            .order('created_at', { ascending: false })];
                case 2:
                    _b = _c.sent(), goals = _b.data, error = _b.error;
                    if (error)
                        throw error;
                    if (!goals || goals.length === 0) {
                        return [2 /*return*/, 'Você não tem metas de economia definidas.'];
                    }
                    goalsText_1 = 'Metas de economia:\n';
                    goals.forEach(function (goal) {
                        var targetDate = new Date(goal.target_date);
                        var formattedDate = targetDate.toLocaleDateString('pt-BR');
                        var progress = (goal.current_amount / goal.target_amount) * 100;
                        goalsText_1 += "- ".concat(goal.name, ": R$ ").concat(goal.current_amount.toFixed(2), " de R$ ").concat(goal.target_amount.toFixed(2), "\n");
                        goalsText_1 += "\uD83D\uDCB0 Progresso: ".concat(progress.toFixed(1), "%\n");
                        goalsText_1 += "\uD83D\uDCC5 Prazo: ".concat(formattedDate, "\n\n");
                    });
                    return [2 /*return*/, goalsText_1];
                case 3:
                    error_3 = _c.sent();
                    console.error('Error fetching savings goals:', error_3);
                    return [2 /*return*/, 'Não foi possível recuperar suas metas de economia.'];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Update the detectAndProcessExpense function to use the user's actual ID
function detectAndProcessExpense(userId, text, userData) {
    return __awaiter(this, void 0, void 0, function () {
        var pattern1, pattern2, pattern3, pattern4, match, description, amount, category, user, error, updateError, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pattern1 = /^([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s+(\d+[.,]?\d*)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)$/i;
                    pattern2 = /^(\d+[.,]?\d*)\s+(?:for|para|em|no|na)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s+(?:in|em|no|na|categoria)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)$/i;
                    pattern3 = /^([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s+(?:for|para|por|de|custa|custou)\s+(\d+[.,]?\d*)\s+(?:in|em|no|na|categoria)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)$/i;
                    pattern4 = /^(?:spent|gastei|gasto|paguei|pago)\s+(\d+[.,]?\d*)\s+(?:on|em|no|na|com|para|por)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s+(?:for|em|no|na|categoria)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)$/i;
                    match = text.match(pattern1);
                    description = '';
                    amount = 0;
                    category = '';
                    if (match) {
                        description = match[1].trim();
                        amount = parseFloat(match[2].replace(',', '.'));
                        category = match[3].trim().toLowerCase();
                    }
                    else {
                        match = text.match(pattern2);
                        if (match) {
                            amount = parseFloat(match[1].replace(',', '.'));
                            description = match[2].trim();
                            category = match[3].trim().toLowerCase();
                        }
                        else {
                            match = text.match(pattern3);
                            if (match) {
                                description = match[1].trim();
                                amount = parseFloat(match[2].replace(',', '.'));
                                category = match[3].trim().toLowerCase();
                            }
                            else {
                                match = text.match(pattern4);
                                if (match) {
                                    amount = parseFloat(match[1].replace(',', '.'));
                                    description = match[2].trim();
                                    category = match[3].trim().toLowerCase();
                                }
                            }
                        }
                    }
                    // If no pattern matched or amount is invalid, return null
                    if (!match || isNaN(amount) || amount <= 0) {
                        return [2 /*return*/, null];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!(!userData || !userData.id)) return [3 /*break*/, 3];
                    return [4 /*yield*/, getUserByPhone(userId)];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                    }
                    userData = user;
                    _a.label = 3;
                case 3: return [4 /*yield*/, supabase.from('expenses').insert({
                        user_id: userData.id,
                        description: description,
                        amount: amount,
                        category: category,
                        created_at: new Date().toISOString(),
                    })];
                case 4:
                    error = (_a.sent()).error;
                    if (error) {
                        console.error('Error inserting expense:', error);
                        throw error;
                    }
                    return [4 /*yield*/, supabase
                            .from('users')
                            .update({ balance: userData.balance - amount })
                            .eq('id', userData.id)];
                case 5:
                    updateError = (_a.sent()).error;
                    if (updateError) {
                        console.error('Error updating balance:', updateError);
                        throw updateError;
                    }
                    // Return confirmation message
                    return [2 /*return*/, "\u2705 Despesa registrada com sucesso!\n\uD83D\uDCDD Descri\u00E7\u00E3o: ".concat(description, "\n\uD83D\uDCB0 Valor: R$ ").concat(amount.toFixed(2), "\n\uD83C\uDFF7\uFE0F Categoria: ").concat(category)];
                case 6:
                    error_4 = _a.sent();
                    console.error('Error adding expense:', error_4);
                    return [2 /*return*/, 'Desculpe, ocorreu um erro ao registrar sua despesa. Tente novamente mais tarde.'];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Update the getAIResponse function to use the user's actual ID
function getAIResponse(userId, userMessage, userData) {
    return __awaiter(this, void 0, void 0, function () {
        var user, recentExpenses, savingsGoals, threadId, run, runStatus, threadMessages, assistantMessages, latestMessage, responseText, _i, _a, contentPart, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 14, , 15]);
                    if (!(!userData || !userData.id)) return [3 /*break*/, 2];
                    return [4 /*yield*/, getUserByPhone(userId)];
                case 1:
                    user = _b.sent();
                    if (!user) {
                        return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                    }
                    userData = user;
                    _b.label = 2;
                case 2: return [4 /*yield*/, getUserRecentExpenses(userId)];
                case 3:
                    recentExpenses = _b.sent();
                    return [4 /*yield*/, getUserSavingsGoals(userId)];
                case 4:
                    savingsGoals = _b.sent();
                    return [4 /*yield*/, getOrCreateThread(userId)];
                case 5:
                    threadId = _b.sent();
                    // Add the user's message to the thread
                    return [4 /*yield*/, openai.beta.threads.messages.create(threadId, {
                            role: 'user',
                            content: userMessage,
                        })];
                case 6:
                    // Add the user's message to the thread
                    _b.sent();
                    return [4 /*yield*/, openai.beta.threads.runs.create(threadId, {
                            assistant_id: process.env.ASSISTANT_ID || 'asst_mHPQNhkfsXrNsjBvMPd4Lj3F',
                            instructions: "You are EconomiZap, a helpful and friendly financial assistant.\n\t\t\t\tYou help users manage their finances, track expenses, set savings goals, and provide financial advice.\n\t\t\t\tBe conversational, friendly, and helpful. Use emojis occasionally to make the conversation engaging.\n\n\t\t\t\tUser's financial data:\n\t\t\t\t- Name: ".concat(userData.name, "\n\t\t\t\t- Current Balance: R$ ").concat(userData.balance.toFixed(2), "\n\n\t\t\t\t").concat(recentExpenses, "\n\n\t\t\t\t").concat(savingsGoals, "\n\n\t\t\t\tYou can help the user with:\n\t\t\t\t1. Recording expenses (use !gasto command or simply type in natural language like \"Uber 12 transportation\")\n\t\t\t\t2. Creating savings goals (use !meta command)\n\t\t\t\t3. Viewing savings goals (use !metas command)\n\t\t\t\t4. Generating financial reports (use !relatorio command)\n\t\t\t\t5. Viewing expense charts (use !grafico command)\n\n\t\t\t\tThe user can add expenses in natural language using these formats:\n\t\t\t\t- \"Uber 12 transportation\" (description amount category)\n\t\t\t\t- \"12 for uber in transportation\" (amount for description in category)\n\t\t\t\t- \"uber for 12 in transportation\" (description for amount in category)\n\t\t\t\t- \"spent 12 on uber for transportation\" (spent amount on description for category)\n\n\t\t\t\tIf the user wants to perform a specific action like recording an expense or setting a goal,\n\t\t\t\tguide them to use the appropriate command or natural language format. For general financial advice, respond directly.\n\n\t\t\t\tAlways respond in Portuguese (Brazilian) as this is a Brazilian financial assistant."),
                        })];
                case 7:
                    run = _b.sent();
                    return [4 /*yield*/, openai.beta.threads.runs.retrieve(threadId, run.id)];
                case 8:
                    runStatus = _b.sent();
                    _b.label = 9;
                case 9:
                    if (!(runStatus.status === 'queued' || runStatus.status === 'in_progress')) return [3 /*break*/, 12];
                    // Wait for 1 second before checking again
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 10:
                    // Wait for 1 second before checking again
                    _b.sent();
                    return [4 /*yield*/, openai.beta.threads.runs.retrieve(threadId, run.id)];
                case 11:
                    runStatus = _b.sent();
                    return [3 /*break*/, 9];
                case 12:
                    // Check if run completed successfully
                    if (runStatus.status !== 'completed') {
                        console.error('Run did not complete successfully:', runStatus.status);
                        return [2 /*return*/, 'Desculpe, estou com dificuldades para processar sua mensagem no momento. Você pode tentar novamente ou usar um dos comandos como !ajuda.'];
                    }
                    return [4 /*yield*/, openai.beta.threads.messages.list(threadId)];
                case 13:
                    threadMessages = _b.sent();
                    assistantMessages = threadMessages.data.filter(function (msg) { return msg.role === 'assistant'; });
                    if (assistantMessages.length === 0) {
                        return [2 /*return*/, 'Não foi possível obter uma resposta. Por favor, tente novamente.'];
                    }
                    latestMessage = assistantMessages[0];
                    responseText = '';
                    if (latestMessage.content && latestMessage.content.length > 0) {
                        for (_i = 0, _a = latestMessage.content; _i < _a.length; _i++) {
                            contentPart = _a[_i];
                            if (contentPart.type === 'text') {
                                responseText += contentPart.text.value;
                            }
                        }
                    }
                    return [2 /*return*/, responseText || 'Desculpe, não consegui processar sua solicitação.'];
                case 14:
                    error_5 = _b.sent();
                    console.error('Error getting AI response:', error_5);
                    return [2 /*return*/, 'Desculpe, estou com dificuldades para processar sua mensagem no momento. Você pode tentar novamente ou usar um dos comandos como !ajuda.'];
                case 15: return [2 /*return*/];
            }
        });
    });
}
// Store thread IDs for each user
var userThreads = {};
// Get or create a thread for a user
function getOrCreateThread(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var thread, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Check if we already have a thread for this user
                    if (userThreads[userId]) {
                        return [2 /*return*/, userThreads[userId]];
                    }
                    return [4 /*yield*/, openai.beta.threads.create()];
                case 1:
                    thread = _a.sent();
                    // Store the thread ID
                    userThreads[userId] = thread.id;
                    return [2 /*return*/, thread.id];
                case 2:
                    error_6 = _a.sent();
                    console.error('Error getting or creating thread:', error_6);
                    throw error_6;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Add a utility function to get user by phone number
function getUserByPhone(phone) {
    return __awaiter(this, void 0, void 0, function () {
        var formattedPhone, _a, data, error, error_7;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    formattedPhone = formatWhatsAppId(phone);
                    return [4 /*yield*/, supabase.from('users').select('*').eq('phone', formattedPhone).single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error && error.code !== 'PGRST116') {
                        console.error('Error fetching user by phone:', error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_7 = _b.sent();
                    console.error('Error in getUserByPhone:', error_7);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Helper function to generate ASCII bar chart
function generateASCIIBarChart(data) {
    if (data.length === 0)
        return 'Não há dados para exibir';
    // Find the maximum value for scaling
    var maxValue = Math.max.apply(Math, data.map(function (item) { return item.value; }));
    // Sort data by value (descending)
    var sortedData = __spreadArray([], data, true).sort(function (a, b) { return b.value - a.value; });
    var chart = '📊 Gráfico de Despesas por Categoria:\n\n';
    sortedData.forEach(function (item) {
        // Calculate bar length based on value relative to max
        var barLength = Math.round((item.value / maxValue) * 20);
        var bar = '█'.repeat(barLength);
        // Format the label and value
        chart += "".concat(item.label.padEnd(15), " ").concat(bar, " R$ ").concat(item.value.toFixed(2), "\n");
    });
    return chart;
}
// Helper function to generate a simple text-based pie chart representation
function generateTextPieChart(data) {
    if (data.length === 0)
        return 'Não há dados para exibir';
    // Calculate total
    var total = data.reduce(function (sum, item) { return sum + item.value; }, 0);
    // Sort data by value (descending)
    var sortedData = __spreadArray([], data, true).sort(function (a, b) { return b.value - a.value; });
    // Pie chart symbols
    var symbols = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫'];
    var chart = '🥧 Distribuição de Despesas:\n\n';
    // Create legend with percentages
    sortedData.forEach(function (item, index) {
        var percentage = (item.value / total) * 100;
        var pieceSize = Math.round(percentage / 5);
        var symbol = symbols[index % symbols.length];
        chart += "".concat(symbol, " ").concat(item.label, ": ").concat(symbol.repeat(pieceSize), " ").concat(percentage.toFixed(1), "%\n");
    });
    return chart;
}
// Initialize WhatsApp client
var client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    },
});
// Map to store user states
var userStates = {};
// Command handlers
var commandHandlers = {
    start: function (message, user) {
        return __awaiter(this, void 0, void 0, function () {
            var userData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _a.sent();
                        if (!userData) {
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _a.label = 2;
                    case 2: return [2 /*return*/, ("\uD83D\uDC4B Ol\u00E1 ".concat(user.name, "! Bem-vindo ao EconomiZap!\n\n") +
                            "Sou seu assistente financeiro pessoal. Como posso ajudar voc\u00EA hoje?\n\n" +
                            "\uD83D\uDCF1 *Comandos Dispon\u00EDveis*\n\n" +
                            "!gasto - Registrar uma nova despesa\n" +
                            "!meta - Criar uma nova meta de economia\n" +
                            "!metas - Ver suas metas de economia\n" +
                            "!saldo - Verificar seu saldo atual\n" +
                            "!relatorio - Gerar relat\u00F3rio financeiro\n" +
                            "!grafico - Visualizar gr\u00E1ficos de despesas\n\n" +
                            "Voc\u00EA tamb\u00E9m pode registrar despesas diretamente escrevendo no formato:\n" +
                            "\"Uber 12 transporte\" (descri\u00E7\u00E3o valor categoria)\n\n" +
                            "Ou simplesmente converse comigo sobre suas finan\u00E7as! \uD83D\uDCAC")];
                }
            });
        });
    },
    gasto: function (message, user, args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.despesa(message, user, args)];
            });
        });
    },
    despesa: function (message, user, args) {
        return __awaiter(this, void 0, void 0, function () {
            var userData, description, amount, category, _a, expense, error, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _b.sent();
                        if (!userData) {
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _b.label = 2;
                    case 2:
                        if (!(args && args.length >= 3)) return [3 /*break*/, 6];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        description = args[0];
                        amount = parseFloat(args[1]);
                        category = args[2];
                        if (isNaN(amount)) {
                            return [2 /*return*/, 'Valor inválido. Por favor, informe um número válido.'];
                        }
                        return [4 /*yield*/, supabase
                                .from('expenses')
                                .insert([
                                {
                                    user_id: user.id,
                                    description: description,
                                    amount: amount,
                                    category: category,
                                    date: new Date().toISOString(),
                                },
                            ])
                                .select()];
                    case 4:
                        _a = _b.sent(), expense = _a.data, error = _a.error;
                        if (error) {
                            console.error('Error adding expense:', error);
                            return [2 /*return*/, 'Erro ao adicionar despesa. Por favor, tente novamente.'];
                        }
                        return [2 /*return*/, "\u2705 Despesa \"".concat(description, "\" de R$ ").concat(amount.toFixed(2), " na categoria \"").concat(category, "\" adicionada com sucesso!")];
                    case 5:
                        error_8 = _b.sent();
                        console.error('Error parsing expense arguments:', error_8);
                        return [2 /*return*/, 'Formato inválido. Use: !gasto descrição valor categoria'];
                    case 6:
                        // Set the user state to ADDING_EXPENSE
                        userStates[message.from] = {
                            state: 'AWAITING_EXPENSE_DESCRIPTION',
                            data: {},
                        };
                        return [2 /*return*/, 'Qual a descrição da despesa?'];
                }
            });
        });
    },
    meta: function (message, user, args) {
        return __awaiter(this, void 0, void 0, function () {
            var userData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _a.sent();
                        if (!userData) {
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _a.label = 2;
                    case 2:
                        userStates[message.from] = { state: 'AWAITING_GOAL_NAME', data: {} };
                        return [2 /*return*/, 'Qual o nome da sua meta de economia?'];
                }
            });
        });
    },
    metas: function (message, user) {
        return __awaiter(this, void 0, void 0, function () {
            var userData, _a, goals, error, response_1, error_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _b.sent();
                        if (!userData) {
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, supabase
                                .from('savings_goals')
                                .select('*')
                                .eq('user_id', user.id)
                                .order('created_at', { ascending: false })];
                    case 3:
                        _a = _b.sent(), goals = _a.data, error = _a.error;
                        if (error)
                            throw error;
                        if (!goals || goals.length === 0) {
                            return [2 /*return*/, 'Você ainda não tem metas de economia definidas. Use !meta para criar uma.'];
                        }
                        response_1 = '🎯 *Suas Metas de Economia*\n\n';
                        goals.forEach(function (goal) {
                            var targetDate = new Date(goal.target_date);
                            var formattedDate = format(targetDate, 'dd/MM/yyyy');
                            var progress = (goal.current_amount / goal.target_amount) * 100;
                            response_1 += "*".concat(goal.name, "*\n");
                            response_1 += "\uD83D\uDCB0 Progresso: R$ ".concat(goal.current_amount.toFixed(2), " / R$ ").concat(goal.target_amount.toFixed(2), "\n");
                            response_1 += "\uD83D\uDCCA Completado: ".concat(progress.toFixed(1), "%\n");
                            response_1 += "\uD83D\uDCC5 Prazo: ".concat(formattedDate, "\n\n");
                        });
                        return [2 /*return*/, response_1];
                    case 4:
                        error_9 = _b.sent();
                        console.error('Error fetching savings goals:', error_9);
                        return [2 /*return*/, 'Desculpe, ocorreu um erro ao buscar suas metas de economia. Tente novamente mais tarde.'];
                    case 5: return [2 /*return*/];
                }
            });
        });
    },
    saldo: function (message, user) {
        return __awaiter(this, void 0, void 0, function () {
            var userData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _a.sent();
                        if (!userData) {
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _a.label = 2;
                    case 2: return [2 /*return*/, "\uD83D\uDCB0 *Seu Saldo Atual*\nR$ ".concat(user.balance.toFixed(2).replace('.', ','))];
                }
            });
        });
    },
    relatorio: function (message, user) {
        return __awaiter(this, void 0, void 0, function () {
            var userData, now, startOfMonth, _a, expenses, expensesError, total_1, monthName, report_1, categories_1, categoryData, error_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _b.sent();
                        if (!userData) {
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        now = new Date();
                        startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        return [4 /*yield*/, supabase
                                .from('expenses')
                                .select('*')
                                .eq('user_id', user.id)
                                .gte('created_at', startOfMonth.toISOString())
                                .order('created_at', { ascending: false })];
                    case 3:
                        _a = _b.sent(), expenses = _a.data, expensesError = _a.error;
                        if (expensesError)
                            throw expensesError;
                        total_1 = (expenses === null || expenses === void 0 ? void 0 : expenses.reduce(function (sum, expense) { return sum + expense.amount; }, 0)) || 0;
                        monthName = format(new Date(), 'MMMM', { locale: ptBR });
                        report_1 = "\uD83D\uDCCA *Relat\u00F3rio Financeiro - ".concat(monthName, "*\n\n");
                        report_1 += "\uD83D\uDCB0 Total de despesas: R$ ".concat(total_1.toFixed(2).replace('.', ','), "\n\n");
                        categories_1 = {};
                        expenses === null || expenses === void 0 ? void 0 : expenses.forEach(function (expense) {
                            if (!categories_1[expense.category]) {
                                categories_1[expense.category] = 0;
                            }
                            categories_1[expense.category] += expense.amount;
                        });
                        categoryData = Object.entries(categories_1).map(function (_a) {
                            var label = _a[0], value = _a[1];
                            return ({ label: label, value: value });
                        });
                        // Sort by value (highest first)
                        categoryData.sort(function (a, b) { return b.value - a.value; });
                        // Add category breakdown
                        report_1 += "\uD83D\uDCCB *Despesas por Categoria*\n";
                        categoryData.forEach(function (_a) {
                            var label = _a.label, value = _a.value;
                            var percentage = (value / total_1) * 100;
                            report_1 += "".concat(label, ": R$ ").concat(value.toFixed(2).replace('.', ','), " (").concat(percentage.toFixed(1), "%)\n");
                        });
                        // Add ASCII chart
                        report_1 += "\n".concat(generateASCIIBarChart(categoryData), "\n");
                        // Add text pie chart
                        report_1 += "\n".concat(generateTextPieChart(categoryData), "\n");
                        // Add note about using !grafico command
                        report_1 += "\nPara visualizar apenas os gr\u00E1ficos, use o comando !grafico";
                        return [2 /*return*/, report_1];
                    case 4:
                        error_10 = _b.sent();
                        console.error('Error generating report:', error_10);
                        return [2 /*return*/, 'Desculpe, ocorreu um erro ao gerar seu relatório. Tente novamente mais tarde.'];
                    case 5: return [2 /*return*/];
                }
            });
        });
    },
    grafico: function (message, user) {
        return __awaiter(this, void 0, void 0, function () {
            var userData, now, startOfMonth, _a, expenses, expensesError, categories_2, categoryData, barChart, pieChart, response, error_11;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _b.sent();
                        if (!userData) {
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        now = new Date();
                        startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        return [4 /*yield*/, supabase
                                .from('expenses')
                                .select('*')
                                .eq('user_id', user.id)
                                .gte('created_at', startOfMonth.toISOString())
                                .order('created_at', { ascending: false })];
                    case 3:
                        _a = _b.sent(), expenses = _a.data, expensesError = _a.error;
                        if (expensesError)
                            throw expensesError;
                        if (!expenses || expenses.length === 0) {
                            return [2 /*return*/, 'Você não tem despesas registradas neste mês.'];
                        }
                        categories_2 = {};
                        expenses.forEach(function (expense) {
                            if (!categories_2[expense.category]) {
                                categories_2[expense.category] = 0;
                            }
                            categories_2[expense.category] += expense.amount;
                        });
                        categoryData = Object.entries(categories_2).map(function (_a) {
                            var label = _a[0], value = _a[1];
                            return ({ label: label, value: value });
                        });
                        // Sort by value (highest first)
                        categoryData.sort(function (a, b) { return b.value - a.value; });
                        barChart = generateASCIIBarChart(categoryData);
                        pieChart = generateTextPieChart(categoryData);
                        response = "\uD83D\uDCCA *Gr\u00E1ficos de Despesas*\n\n".concat(barChart, "\n\n").concat(pieChart);
                        return [2 /*return*/, response];
                    case 4:
                        error_11 = _b.sent();
                        console.error('Error generating chart:', error_11);
                        return [2 /*return*/, 'Desculpe, ocorreu um erro ao gerar seu gráfico. Tente novamente mais tarde.'];
                    case 5: return [2 /*return*/];
                }
            });
        });
    },
    ajuda: function (message, user) {
        return __awaiter(this, void 0, void 0, function () {
            var userData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _a.sent();
                        if (!userData) {
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _a.label = 2;
                    case 2: return [2 /*return*/, ("\uD83D\uDCF1 *Comandos do EconomiZap*\n\n" +
                            "!gasto - Registrar uma nova despesa\n" +
                            "!meta - Criar uma nova meta de economia\n" +
                            "!metas - Ver suas metas de economia\n" +
                            "!saldo - Verificar seu saldo atual\n" +
                            "!relatorio - Gerar relat\u00F3rio financeiro\n" +
                            "!grafico - Visualizar gr\u00E1ficos de despesas\n\n" +
                            "Voc\u00EA tamb\u00E9m pode registrar despesas diretamente escrevendo no formato:\n" +
                            "\"Uber 12 transporte\" (descri\u00E7\u00E3o valor categoria)\n\n" +
                            "Ou simplesmente converse comigo sobre suas finan\u00E7as! \uD83D\uDCAC")];
                }
            });
        });
    },
};
// State handlers
var stateHandlers = {
    AWAITING_EXPENSE_DESCRIPTION: function (message, user, state) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                state.data.description = message.body;
                state.state = 'AWAITING_EXPENSE_AMOUNT';
                return [2 /*return*/, 'Qual o valor da despesa? (apenas números, ex: 10.50)'];
            });
        });
    },
    AWAITING_EXPENSE_AMOUNT: function (message, user, state) {
        return __awaiter(this, void 0, void 0, function () {
            var amount;
            return __generator(this, function (_a) {
                amount = parseFloat(message.body.replace(',', '.'));
                if (isNaN(amount)) {
                    return [2 /*return*/, 'Por favor, digite um valor válido (apenas números, ex: 10.50)'];
                }
                state.data.amount = amount;
                state.state = 'AWAITING_EXPENSE_CATEGORY';
                return [2 /*return*/, 'Qual a categoria da despesa? (ex: Alimentação, Transporte, Lazer)'];
            });
        });
    },
    AWAITING_EXPENSE_CATEGORY: function (message, user, state) {
        return __awaiter(this, void 0, void 0, function () {
            var userData, error, balanceError, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        state.data.category = message.body;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!(!user || !user.id)) return [3 /*break*/, 3];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 2:
                        userData = _a.sent();
                        if (!userData) {
                            delete userStates[message.from];
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _a.label = 3;
                    case 3: return [4 /*yield*/, supabase.from('expenses').insert({
                            user_id: user.id,
                            description: state.data.description,
                            amount: state.data.amount,
                            category: state.data.category,
                            created_at: new Date().toISOString(),
                        })];
                    case 4:
                        error = (_a.sent()).error;
                        if (error) {
                            console.error('Error inserting expense:', error);
                            throw error;
                        }
                        return [4 /*yield*/, supabase.rpc('update_user_balance', {
                                user_id_param: user.id,
                                amount_param: -state.data.amount,
                            })];
                    case 5:
                        balanceError = (_a.sent()).error;
                        if (balanceError) {
                            console.error('Error updating balance:', balanceError);
                            throw balanceError;
                        }
                        // Clear user state
                        delete userStates[message.from];
                        return [2 /*return*/, "\u2705 Despesa registrada com sucesso!\n\nDescri\u00E7\u00E3o: ".concat(state.data.description, "\nValor: R$ ").concat(state.data.amount
                                .toFixed(2)
                                .replace('.', ','), "\nCategoria: ").concat(state.data.category)];
                    case 6:
                        error_12 = _a.sent();
                        console.error('Error saving expense:', error_12);
                        delete userStates[message.from];
                        return [2 /*return*/, 'Desculpe, não consegui salvar sua despesa. Tente novamente mais tarde.'];
                    case 7: return [2 /*return*/];
                }
            });
        });
    },
    AWAITING_GOAL_NAME: function (message, user, state) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                state.data.name = message.body;
                state.state = 'AWAITING_GOAL_AMOUNT';
                return [2 /*return*/, 'Qual o valor da meta? (apenas números, ex: 1000.00)'];
            });
        });
    },
    AWAITING_GOAL_AMOUNT: function (message, user, state) {
        return __awaiter(this, void 0, void 0, function () {
            var amount;
            return __generator(this, function (_a) {
                amount = parseFloat(message.body.replace(',', '.'));
                if (isNaN(amount)) {
                    return [2 /*return*/, 'Por favor, digite um valor válido (apenas números, ex: 1000.00)'];
                }
                state.data.amount = amount;
                state.state = 'AWAITING_GOAL_DATE';
                return [2 /*return*/, 'Qual a data limite para atingir essa meta? (formato: DD/MM/AAAA)'];
            });
        });
    },
    AWAITING_GOAL_DATE: function (message, user, state) {
        return __awaiter(this, void 0, void 0, function () {
            var userData, dateStr, date, error, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!(!user || !user.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getUserByPhone(formatWhatsAppId(message.from))];
                    case 1:
                        userData = _a.sent();
                        if (!userData) {
                            delete userStates[message.from];
                            return [2 /*return*/, 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.'];
                        }
                        user = userData;
                        _a.label = 2;
                    case 2:
                        dateStr = message.body;
                        date = parse(dateStr, 'dd/MM/yyyy', new Date());
                        if (isNaN(date.getTime())) {
                            return [2 /*return*/, 'Data inválida. Por favor, digite a data no formato DD/MM/AAAA:'];
                        }
                        return [4 /*yield*/, supabase.from('savings_goals').insert({
                                user_id: user.id,
                                name: state.data.name,
                                target_amount: state.data.amount,
                                current_amount: 0,
                                target_date: date.toISOString(),
                                created_at: new Date().toISOString(),
                            })];
                    case 3:
                        error = (_a.sent()).error;
                        if (error) {
                            console.error('Error inserting goal:', error);
                            throw error;
                        }
                        // Clear user state
                        delete userStates[message.from];
                        return [2 /*return*/, "\u2705 Meta de economia criada com sucesso!\n\nNome: ".concat(state.data.name, "\nValor: R$ ").concat(state.data.amount
                                .toFixed(2)
                                .replace('.', ','), "\nData: ").concat(format(date, 'dd/MM/yyyy'))];
                    case 4:
                        error_13 = _a.sent();
                        console.error('Error saving goal:', error_13);
                        delete userStates[message.from];
                        return [2 /*return*/, 'Desculpe, não consegui salvar sua meta. Tente novamente mais tarde.'];
                    case 5: return [2 /*return*/];
                }
            });
        });
    },
};
// Message handler
client.on('message', function (message) { return __awaiter(_this, void 0, void 0, function () {
    var userId, user, contact, name_1, _a, newUser, createError, userState, handler, response, commandText, _b, command, args, handler, response, expenseResult, aiResponse, error_14;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 25, , 27]);
                userId = formatWhatsAppId(message.from);
                return [4 /*yield*/, getUserByPhone(userId)];
            case 1:
                user = _c.sent();
                if (!!user) return [3 /*break*/, 7];
                return [4 /*yield*/, message.getContact()];
            case 2:
                contact = _c.sent();
                name_1 = contact.pushname || 'Usuário';
                return [4 /*yield*/, supabase
                        .from('users')
                        .insert({
                        phone: userId,
                        name: name_1,
                        balance: 0,
                        created_at: new Date().toISOString(),
                    })
                        .select()
                        .single()];
            case 3:
                _a = _c.sent(), newUser = _a.data, createError = _a.error;
                if (!createError) return [3 /*break*/, 5];
                console.error('Error creating user:', createError);
                return [4 /*yield*/, message.reply('Desculpe, ocorreu um erro. Tente novamente mais tarde.')];
            case 4:
                _c.sent();
                return [2 /*return*/];
            case 5: return [4 /*yield*/, message.reply("Ol\u00E1 ".concat(name_1, "! Bem-vindo ao EconomiZap! Sou seu assistente financeiro pessoal. Como posso ajudar voc\u00EA hoje? Digite !ajuda para ver os comandos dispon\u00EDveis ou simplesmente converse comigo sobre suas finan\u00E7as."))];
            case 6:
                _c.sent();
                return [2 /*return*/];
            case 7:
                userState = userStates[message.from];
                if (!userState) return [3 /*break*/, 12];
                handler = stateHandlers[userState.state];
                if (!handler) return [3 /*break*/, 10];
                return [4 /*yield*/, handler(message, user, userState)];
            case 8:
                response = _c.sent();
                return [4 /*yield*/, message.reply(response)];
            case 9:
                _c.sent();
                return [3 /*break*/, 11];
            case 10:
                delete userStates[message.from];
                _c.label = 11;
            case 11: return [3 /*break*/, 24];
            case 12:
                if (!(message.body.startsWith('/') || message.body.startsWith('!'))) return [3 /*break*/, 18];
                commandText = message.body.substring(1);
                _b = commandText.split(' '), command = _b[0], args = _b.slice(1);
                handler = commandHandlers[command.toLowerCase()];
                if (!handler) return [3 /*break*/, 15];
                return [4 /*yield*/, handler(message, user, args)];
            case 13:
                response = _c.sent();
                return [4 /*yield*/, message.reply(response)];
            case 14:
                _c.sent();
                return [3 /*break*/, 17];
            case 15: return [4 /*yield*/, message.reply("Comando n\u00E3o reconhecido. Digite !ajuda para ver os comandos dispon\u00EDveis.")];
            case 16:
                _c.sent();
                _c.label = 17;
            case 17: return [3 /*break*/, 24];
            case 18: return [4 /*yield*/, detectAndProcessExpense(userId, message.body, user)];
            case 19:
                expenseResult = _c.sent();
                if (!expenseResult) return [3 /*break*/, 21];
                // It was an expense entry, send the confirmation
                return [4 /*yield*/, message.reply(expenseResult)];
            case 20:
                // It was an expense entry, send the confirmation
                _c.sent();
                return [3 /*break*/, 24];
            case 21: return [4 /*yield*/, getAIResponse(userId, message.body, user)];
            case 22:
                aiResponse = _c.sent();
                return [4 /*yield*/, message.reply(aiResponse)];
            case 23:
                _c.sent();
                _c.label = 24;
            case 24: return [3 /*break*/, 27];
            case 25:
                error_14 = _c.sent();
                console.error('Error handling message:', error_14);
                return [4 /*yield*/, message.reply('Desculpe, ocorreu um erro. Tente novamente mais tarde.')];
            case 26:
                _c.sent();
                return [3 /*break*/, 27];
            case 27: return [2 /*return*/];
        }
    });
}); });
// WhatsApp client events
client.on('qr', function (qr) {
    console.log('QR RECEIVED:');
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above to log in to WhatsApp Web');
});
client.on('ready', function () {
    console.log('Client is ready!');
});
client.on('authenticated', function () {
    console.log('Client is authenticated!');
});
client.on('auth_failure', function (msg) {
    console.error('WhatsApp authentication failed:', msg);
});
// Initialize client
client.initialize();
// Handle process termination
process.on('SIGINT', function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Shutting down...');
                return [4 /*yield*/, client.destroy()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
