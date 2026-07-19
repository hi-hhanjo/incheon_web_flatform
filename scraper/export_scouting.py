import sys
import os
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from kleague.codes import normalize_team_name, normalize_tm_team_name

# Add parent dir to sys path if needed to run independently
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Ensure we run from project root (if running from scraper dir, paths might need adjustment)
# The script will be run from the scraper dir, so we save to ../data/
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "opponent-scouting.json")

def fetch_daum_person_rank(year: str, sort: str):
    url = f"https://sports.daum.net/prx/hermes/api/person/rank.json?leagueCode=kl&seasonKey={year}&sort={sort}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        data = res.json()
        return data.get('list', [])
    except Exception as e:
        print(f"Failed to fetch daum person rank ({sort}): {e}")
        return []

def scrape_transfermarkt_injuries():
    url = "https://www.transfermarkt.com/k-league-1/verletztespieler/wettbewerb/RSK1"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
    injuries_by_team = {}
    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        
        tables = soup.find_all('table', class_='items')
        if not tables:
            print("No items table found in Transfermarkt.")
            return injuries_by_team
            
        table = tables[0]
        rows = table.find('tbody').find_all('tr', recursive=False)
        
        for row in rows:
            cols = row.find_all('td', recursive=False)
            if len(cols) < 5:
                continue
                
            player_cell = cols[0]
            player_link = player_cell.find('td', class_='hauptlink')
            if player_link and player_link.find('a'):
                player_name = player_link.find('a').text.strip()
            else:
                continue
                
            team_cell = cols[1]
            team_img = team_cell.find('img')
            tm_team_name = team_img.get('title') or team_img.get('alt') if team_img else "Unknown"
            normalized_team = normalize_tm_team_name(tm_team_name)
            
            injury_type = cols[2].text.strip()
            return_date = cols[4].text.strip() if len(cols) > 4 else "미정"
            if not return_date or return_date.startswith("€"):
                return_date = "미정"
                
            if normalized_team not in injuries_by_team:
                injuries_by_team[normalized_team] = []
                
            injuries_by_team[normalized_team].append({
                "name": player_name,
                "status": injury_type,
                "expectedReturn": return_date
            })
    except Exception as e:
        print(f"Failed to fetch transfermarkt injuries: {e}")
        
    return injuries_by_team

def export_scouting(year: str):
    print(f"Fetching key players for {year}...")
    goals = fetch_daum_person_rank(year, "gf")
    assists = fetch_daum_person_rank(year, "ast")
    
    # Map team -> players
    teams_data = {}
    
    # Process goals
    for p in goals:
        team_short = p.get('statTeam', {}).get('shortNameKo')
        if not team_short:
            continue
        team_name = normalize_team_name(team_short)
        
        if team_name not in teams_data:
            teams_data[team_name] = {"keyPlayers": [], "injuries": []}
            
        if len(teams_data[team_name]["keyPlayers"]) < 2:
            name = p.get('nameKo') or p.get('nameMain')
            position = p.get('position', {}).get('nameMain', 'Unknown')
            stat = p.get('stat', {})
            gf = stat.get('gf', 0)
            ast = stat.get('ast', 0)
            note = f"시즌 {gf}골 (팀 내 핵심)"
            
            # Avoid duplicates if someone appears in both (we'll check when doing assists)
            teams_data[team_name]["keyPlayers"].append({
                "name": name,
                "position": position,
                "note": note
            })
            
    # Fill remaining from assists if needed
    for p in assists:
        team_short = p.get('statTeam', {}).get('shortNameKo')
        if not team_short:
            continue
        team_name = normalize_team_name(team_short)
        
        if team_name not in teams_data:
            teams_data[team_name] = {"keyPlayers": [], "injuries": []}
            
        if len(teams_data[team_name]["keyPlayers"]) < 2:
            name = p.get('nameKo') or p.get('nameMain')
            
            # Check if already added from goals
            existing = [kp["name"] for kp in teams_data[team_name]["keyPlayers"]]
            if name not in existing:
                position = p.get('position', {}).get('nameMain', 'Unknown')
                stat = p.get('stat', {})
                ast = stat.get('ast', 0)
                note = f"시즌 {ast}도움 (주요 자원)"
                
                teams_data[team_name]["keyPlayers"].append({
                    "name": name,
                    "position": position,
                    "note": note
                })

    print("Fetching injuries from Transfermarkt...")
    tm_injuries = scrape_transfermarkt_injuries()
    
    # Merge injuries
    for team, injuries in tm_injuries.items():
        if team not in teams_data:
            teams_data[team] = {"keyPlayers": [], "injuries": []}
        teams_data[team]["injuries"] = injuries

    # Make sure all teams have at least empty lists
    for t, data in teams_data.items():
        if "probableLineup" not in data:
            data["probableLineup"] = []

    # Write to file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(teams_data, f, ensure_ascii=False, indent=2)
        
    print(f"Exported scouting data for {len(teams_data)} teams to {OUTPUT_FILE}")

if __name__ == "__main__":
    year = sys.argv[1] if len(sys.argv) > 1 else str(datetime.now().year)
    export_scouting(year)
