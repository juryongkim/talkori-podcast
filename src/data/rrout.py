import json
import os

# 1. 경로 설정 (작가님의 실제 폴더 경로)
data_folder = r'C:\Study\한국어\톡코리웹앱\팟캐스트\talkori-podcast\client\src\data'
output_file = 'RealReaction_TOC.txt'

def extract_toc():
    if not os.path.exists(data_folder):
        print(f"❌ 경로를 찾을 수 없습니다: {data_folder}")
        return

    # 폴더 내 모든 파일 리스트업
    all_contents = os.listdir(data_folder)
    # ep로 시작하고 .json으로 끝나는 파일 필터링
    files = [f for f in all_contents if f.lower().startswith('ep') and f.lower().endswith('.json')]
    files.sort() # 순서대로 정렬

    print(f"📂 발견된 에피소드 파일 개수: {len(files)}개")

    toc_list = []

    for filename in files:
        file_path = os.path.join(data_folder, filename)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
                
                # 데이터가 리스트[]인지 단일 객체{}인지 확인 후 처리
                if isinstance(content, list):
                    # 리스트라면 첫 번째 요소에서 metadata를 찾음
                    target_data = content[0]
                else:
                    # 단일 객체라면 바로 접근
                    target_data = content
                
                metadata = target_data.get('metadata', {})
                
                # 데이터 추출 (키값이 없을 경우를 대비해 get 사용)
                ep_id = metadata.get('id', filename.replace('.json', ''))
                title = metadata.get('title', {})
                desc = metadata.get('description', {})

                title_ko = title.get('ko', '제목 없음')
                title_en = title.get('en', 'No Title')
                desc_ko = desc.get('ko', '설명 없음')

                # 목차 텍스트 생성
                entry = f"[{ep_id}] {title_ko} | {title_en}\n"
                entry += f"   - 요약: {desc_ko}\n"
                entry += "-" * 60 + "\n"
                
                toc_list.append(entry)
                print(f"✅ {filename} 처리 완료")

        except Exception as e:
            print(f"⚠️ {filename} 읽기 실패: {e}")

    # 결과 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("=== [Real Reaction] 팟캐스트 에피소드 전체 목차 ===\n\n")
        if not toc_list:
            f.write("추출된 데이터가 없습니다. JSON 구조를 확인해주세요.\n")
        else:
            f.writelines(toc_list)
    
    print(f"\n✨ 목차 생성 완료! '{output_file}' 파일을 확인하세요.")

if __name__ == "__main__":
    extract_toc()