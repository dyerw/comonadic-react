import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

import type { Functor1 } from 'fp-ts/lib/Functor';
import type { Extend1 } from 'fp-ts/lib/Extend';
import type { Apply1 } from 'fp-ts/lib/Apply';
import type { Comonad1 } from 'fp-ts/lib/Comonad';
import type { Lazy } from 'fp-ts/lib/function';
import type { URIS, Kind } from 'fp-ts/HKT';
import type * as I from 'fp-ts/Identity';
import { identity } from 'fp-ts/lib/function';
import { Stream, stream, URI as StreamURI } from './lib/Stream';
import type { Pointed1 } from 'fp-ts/lib/Pointed';
import type { Applicative1 } from 'fp-ts/lib/Applicative';
import type { Chain1 } from 'fp-ts/lib/Chain';
import type { Monad1 } from 'fp-ts/lib/Monad';
import type { number } from 'fp-ts';

// Example 2.5.2

const nats: Stream<number> = (() => {
  const _stream = (n: number): Stream<number> => {
    return {
      cons: n,
      cdr: () => _stream(n + 1),
    };
  };
  return _stream(1);
})();

function next<A>(s: Stream<A>): Stream<A> {
  return s.cdr();
}

const sumWithNext = (s: Stream<number>): number => s.cons + next(s).cons;

const avgOfNext = (s: Stream<number>, n: number): number => {
  const ns = take(s, n);
  return ns.reduce((prev, curr) => prev + curr, 0) / n;
};

function take<A>(s: Stream<A>, n: number): A[] {
  return n == 0 ? [] : [s.cons, ...take(next(s), n - 1)];
}

const sums = stream.extend(nats, sumWithNext);

const avgs = stream.extend(nats, (s) => avgOfNext(s, 10));
console.log(take(sums, 1000));
console.log(take(avgs, 100));

// 3.1 Pairings of functors
export interface Pairing1<F extends URIS, G extends URIS> {
  readonly URI: F;
  readonly URI2: G;
  readonly pair: <A, B, C>(
    f: (a: A, b: B) => C,
    fa: Kind<F, A>,
    gb: Kind<G, B>,
  ) => C;
}

const identityPair_: Pairing1<I.URI, I.URI>['pair'] = (f, fa, gb) => f(fa, gb);

// 3.2.1

function move<W extends URIS, M extends URIS, A, B>(
  space: Kind<W, A>,
  movement: Kind<M, B>,
  comonad: Comonad1<W>,
  pairing: Pairing1<M, W>,
): Kind<W, A> {
  return pairing.pair(
    (_a, newSpace) => newSpace,
    movement,
    comonad.extend(space, identity),
  );
}

type Sequence<A> =
  | { _tag: 'End'; value: A }
  | { _tag: 'Next'; value: Sequence<A> };

export function end<A>(a: A): Sequence<A> {
  return { _tag: 'End', value: a };
}

export function next_<A>(sa: Sequence<A>): Sequence<A> {
  return { _tag: 'Next', value: sa };
}

export const URI = 'Sequence';
export type URI = typeof URI;
declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Sequence<A>;
  }
}

const map_: Functor1<URI>['map'] = (fa, f) =>
  fa._tag === 'End' ? end(f(fa.value)) : next_(map_(fa.value, f));

export const Functor: Functor1<URI> = {
  URI,
  map: map_,
};

/**
  instance Monad Sequence where
    return = End
    bind f (End a) = f a
    bind f (Next next) = Next (bind f next)
 */

const ap_: Apply1<URI>['ap'] = (fab, fa) =>
  fab._tag === 'End' ? map_(fa, fab.value) : ap_(fab.value, fa);

export const Apply: Apply1<URI> = {
  URI,
  map: map_,
  ap: ap_,
};

const of_: Pointed1<URI>['of'] = end;

export const Pointed: Pointed1<URI> = {
  URI,
  of: of_,
};

export const Applicative: Applicative1<URI> = {
  URI,
  ap: ap_,
  map: map_,
  of: of_,
};

const chain_: Chain1<URI>['chain'] = (fa, f) =>
  fa._tag === 'End' ? f(fa.value) : next_(chain_(fa.value, f));

export const Chain: Chain1<URI> = {
  URI,
  ap: ap_,
  map: map_,
  chain: chain_,
};

export const Monad: Monad1<URI> = {
  URI,
  ap: ap_,
  map: map_,
  chain: chain_,
  of: of_,
};

/**
 * instance Pairing Sequence Stream where
      pair f (End a) (Cons b _) = f a b
      pair f (Next next) (Cons _ stream) = pair f next stream
 */

const pair_: Pairing1<URI, StreamURI>['pair'] = (f, fa, gb) =>
  fa._tag === 'End' ? f(fa.value, gb.cons) : pair_(f, fa.value, gb.cdr());

const Pairing: Pairing1<URI, StreamURI> = {
  URI,
  URI2: StreamURI,
  pair: pair_,
};

const getThird: Sequence<void> = next_(next_(end(undefined)));

const third = move<StreamURI, URI, number, void>(
  nats,
  getThird,
  stream,
  Pairing,
);

console.log(third);
