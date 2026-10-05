-- The public RPC stays SECURITY INVOKER. Inventory has no client write policy.
-- The private trigger is the only controlled ascension write path: it validates
-- ownership, adjacent ranks and exact 3:1 consumption, locking the source row.
CREATE OR REPLACE FUNCTION private.apply_verified_gift_ascension()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := (select auth.uid()); v_to text; v_copies integer;
BEGIN
 IF v_uid IS NULL OR NEW.user_id IS DISTINCT FROM v_uid THEN
  RAISE EXCEPTION 'You can only ascend your own gifts' USING ERRCODE='42501';
 END IF;
 v_to := CASE NEW.from_tier WHEN 'bronze' THEN 'silver' WHEN 'silver' THEN 'gold'
  WHEN 'gold' THEN 'platinum' WHEN 'platinum' THEN 'emerald' ELSE NULL END;
 IF v_to IS NULL OR NEW.to_tier IS DISTINCT FROM v_to
  OR NEW.copies_consumed IS DISTINCT FROM 3 OR NEW.copies_created IS DISTINCT FROM 1 THEN
  RAISE EXCEPTION 'Ascension requires three copies for one adjacent rank';
 END IF;
 SELECT copies INTO v_copies FROM public.user_gift_inventory
  WHERE user_id=v_uid AND gift_id=NEW.gift_id AND tier=NEW.from_tier FOR UPDATE;
 IF coalesce(v_copies,0)<3 THEN RAISE EXCEPTION 'Three copies are required'; END IF;
 UPDATE public.user_gift_inventory SET copies=copies-3,updated_at=now()
  WHERE user_id=v_uid AND gift_id=NEW.gift_id AND tier=NEW.from_tier;
 INSERT INTO public.user_gift_inventory(user_id,gift_id,tier,copies)
  VALUES(v_uid,NEW.gift_id,v_to,1)
 ON CONFLICT(user_id,gift_id,tier) DO UPDATE
  SET copies=public.user_gift_inventory.copies+1,updated_at=now();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.apply_verified_gift_ascension() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS apply_verified_gift_ascension ON public.gift_ascension_ledger;
CREATE TRIGGER apply_verified_gift_ascension AFTER INSERT ON public.gift_ascension_ledger
 FOR EACH ROW EXECUTE FUNCTION private.apply_verified_gift_ascension();
CREATE OR REPLACE FUNCTION public.ascend_gift(p_gift_id uuid,p_from_tier text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_uid uuid := (select auth.uid()); v_to text; v_id uuid;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 v_to:=CASE p_from_tier WHEN 'bronze' THEN 'silver' WHEN 'silver' THEN 'gold'
  WHEN 'gold' THEN 'platinum' WHEN 'platinum' THEN 'emerald' ELSE NULL END;
 IF v_to IS NULL THEN RAISE EXCEPTION 'This tier cannot ascend'; END IF;
 INSERT INTO public.gift_ascension_ledger(user_id,gift_id,from_tier,to_tier)
  VALUES(v_uid,p_gift_id,p_from_tier,v_to) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.ascend_gift(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ascend_gift(uuid,text) TO authenticated;
