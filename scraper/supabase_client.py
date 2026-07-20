import os
from dotenv import load_dotenv
from supabase import create_client, Client

# load .env.local from project root
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(dotenv_path=env_path)

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Supabase credentials not found in .env.local")

supabase: Client = create_client(url, key)
