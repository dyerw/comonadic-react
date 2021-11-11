import type { Functor1 } from 'fp-ts/lib/Functor';
import type { Extend1 } from 'fp-ts/lib/Extend';
import type { Comonad1 } from 'fp-ts/lib/Comonad';
import type { Lazy } from 'fp-ts/lib/function';

export const URI = 'Stream';

export type URI = typeof URI;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Stream<A>;
  }
}

export type Stream<A> = {
  cons: A;
  cdr: Lazy<Stream<A>>;
};

const map_: Functor1<URI>['map'] = (fa, f) => ({
  cons: f(fa.cons),
  cdr: () => map_(fa.cdr(), f),
});

const extend_: Extend1<URI>['extend'] = (wa, f) => ({
  cons: f(wa),
  cdr: () => extend_(wa.cdr(), f),
});

const extract_: Comonad1<URI>['extract'] = (wa) => wa.cons;

export const Functor: Functor1<URI> = {
  URI,
  map: map_,
};

export const Extend: Extend1<URI> = {
  URI,
  map: map_,
  extend: extend_,
};

export const Comonad: Comonad1<URI> = {
  URI,
  map: map_,
  extend: extend_,
  extract: extract_,
};

export const stream: Functor1<URI> & Extend1<URI> & Comonad1<URI> = {
  URI,
  map: map_,
  extend: extend_,
  extract: extract_,
};
