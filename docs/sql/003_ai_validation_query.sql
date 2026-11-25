-- How often does the doctor agree with the AI's visual judgements? Run after reviewing test sessions.
-- Each row of ai_feedback is {"<check id>": "agree" | "disagree"}.
select r.session_id,
       kv.key   as check_id,
       kv.value as doctor_view,
       (select x->>'status' from jsonb_array_elements(s.ai_observations->'results') x where x->>'id' = kv.key) as ai_status
from public.session_reviews r
join public.sessions s on s.id = r.session_id
cross join lateral jsonb_each_text(coalesce(r.ai_feedback, '{}'::jsonb)) kv
order by r.reviewed_at;

select doctor_view, count(*) from (
  select kv.value as doctor_view
  from public.session_reviews r
  cross join lateral jsonb_each_text(coalesce(r.ai_feedback, '{}'::jsonb)) kv
) t group by doctor_view;
