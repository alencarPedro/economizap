-- Function to get column type
CREATE OR REPLACE FUNCTION get_column_type(table_name text, column_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    column_type text;
BEGIN
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2;

    RETURN column_type;
END;
$$;

-- Function to get user ID from phone number
CREATE OR REPLACE FUNCTION get_user_id_from_phone(phone_number text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    SELECT id INTO user_id
    FROM users
    WHERE phone = phone_number;

    RETURN user_id;
END;
$$;

-- Function to create the get_column_type function (callable via RPC)
CREATE OR REPLACE FUNCTION create_get_column_type_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_column_type(table_name text, column_name text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    DECLARE
        column_type text;
    BEGIN
        SELECT data_type INTO column_type
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2;

        RETURN column_type;
    END;
    $func$;
    ';
END;
$$;

-- Function to create the get_user_id_from_phone function (callable via RPC)
CREATE OR REPLACE FUNCTION create_get_user_id_from_phone_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_user_id_from_phone(phone_number text)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    DECLARE
        user_id uuid;
    BEGIN
        SELECT id INTO user_id
        FROM users
        WHERE phone = phone_number;

        RETURN user_id;
    END;
    $func$;
    ';
END;
$$;

-- Drop existing update_user_balance function if it exists
DROP FUNCTION IF EXISTS update_user_balance(uuid, numeric);

-- Function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(
    p_user_id uuid,
    p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET balance = balance - p_amount
    WHERE id = p_user_id;
END;
$$;

-- Drop existing conversation history functions if they exist
DROP FUNCTION IF EXISTS create_conversation_history_table();
DROP FUNCTION IF EXISTS save_conversation_message(uuid, text, text, text, jsonb);
DROP FUNCTION IF EXISTS get_recent_conversation(uuid, integer);

-- Create conversation_history table if it doesn't exist
CREATE OR REPLACE FUNCTION create_conversation_history_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS conversation_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        thread_id TEXT NOT NULL,
        message_content TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
    );

    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id ON conversation_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_history_thread_id ON conversation_history(thread_id);
END;
$$;

-- Function to save a message to conversation history
CREATE OR REPLACE FUNCTION save_conversation_message(
    p_user_id UUID,
    p_thread_id TEXT,
    p_message_content TEXT,
    p_role TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO conversation_history (user_id, thread_id, message_content, role, metadata)
    VALUES (p_user_id, p_thread_id, p_message_content, p_role, p_metadata)
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

-- Function to get recent conversation history for a user
CREATE OR REPLACE FUNCTION get_recent_conversation(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    thread_id TEXT,
    message_content TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ch.id, ch.thread_id, ch.message_content, ch.role, ch.created_at, ch.metadata
    FROM conversation_history ch
    WHERE ch.user_id = p_user_id
    ORDER BY ch.created_at DESC
    LIMIT p_limit;
END;
$$;
